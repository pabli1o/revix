"use client";

import type { PendingSource } from "./source-picker";

/**
 * Persists the in-progress "Nouvelle fiche" draft (texte/photos/PDF/Word)
 * across a full navigation away from the page — needed for an anonymous
 * visitor sent to /signup (or /login) when they click "Générer la fiche",
 * so their work survives the round trip and the generation can resume
 * once they're authenticated (see creation-flow.tsx).
 *
 * A `PendingSource.file`/`files` (the raw File picked for a PDF/Word, kept
 * client-side until signed in — see source-picker.tsx's deferUpload) is
 * never put into IndexedDB as a File/Blob directly: on Safari (iOS/iPadOS
 * especially, and especially in Private Browsing), a File/Blob written to
 * IndexedDB can read back with the right name but silently empty (0
 * bytes) content — this is the confirmed cause of the "PDF refused by
 * storage (No content provided)" bug this module exists to fix. Instead,
 * every File is read into raw bytes (ArrayBuffer) up front and stored as
 * plain {name, type, bytes} — and every write is immediately read back
 * and size-compared before this module considers it saved, so the exact
 * failure mode (silent truncation) is caught right here instead of much
 * later, after the redirect through signup, at upload time.
 *
 * Every call can fail outright too (quota exceeded, IndexedDB unavailable)
 * — callers must still catch and show a clear message; nothing here
 * assumes success.
 */

const DB_NAME = "reviix-draft";
const DB_VERSION = 1;
const STORE_NAME = "draft";
const RECORD_KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponible dans ce navigateur."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB indisponible."));
  });
}

function getRecord(db: IDBDatabase): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Lecture du brouillon impossible."));
  });
}

function putRecord(db: IDBDatabase, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Écriture du brouillon impossible."));
  });
}

/** Plain, structured-clone-safe stand-in for a File — see the module doc
 * comment for why the File itself is never stored directly. */
interface SerializedFile {
  name: string;
  type: string;
  bytes: ArrayBuffer;
}

type SerializedSource = Omit<PendingSource, "file" | "files"> & {
  file?: SerializedFile;
  files?: SerializedFile[];
};

async function toSerializedFile(file: File): Promise<SerializedFile> {
  return { name: file.name, type: file.type, bytes: await file.arrayBuffer() };
}

function fromSerializedFile(rec: SerializedFile): File {
  return new File([rec.bytes], rec.name, { type: rec.type });
}

async function serializeSource(source: PendingSource): Promise<SerializedSource> {
  const { file, files, ...rest } = source;
  const serialized: SerializedSource = { ...rest };
  if (file) serialized.file = await toSerializedFile(file);
  if (files && files.length > 0) serialized.files = await Promise.all(files.map(toSerializedFile));
  return serialized;
}

function deserializeSource(record: SerializedSource): PendingSource {
  const { file, files, ...rest } = record;
  const source = { ...rest } as PendingSource;
  if (file) source.file = fromSerializedFile(file);
  if (files && files.length > 0) source.files = files.map(fromSerializedFile);
  return source;
}

/** The sizes that must round-trip intact for a source to be considered
 * usable — a File's byte length, a photo's base64 string length, or a
 * pasted text's character length. Applied uniformly (not just to PDF/
 * Word) since the same Safari IndexedDB bug this guards against isn't
 * provably limited to Blobs — a cheap, generic check costs nothing. */
function sourceSizes(s: SerializedSource): number[] {
  if (s.file) return [s.file.bytes.byteLength];
  if (s.files && s.files.length > 0) return s.files.map((f) => f.bytes.byteLength);
  if (s.data) return [s.data.length];
  if (s.texte) return [s.texte.length];
  return [1]; // nothing binary/textual to verify (shouldn't happen) — trivially "intact"
}

function isIntact(expected: SerializedSource, actual: SerializedSource | undefined): boolean {
  if (!actual) return false;
  const expectedSizes = sourceSizes(expected);
  const actualSizes = sourceSizes(actual);
  if (expectedSizes.length !== actualSizes.length) return false;
  return expectedSizes.every((size, i) => size > 0 && actualSizes[i] === size);
}

/**
 * Saves the draft. Returns the id/nom of any source dropped because it
 * didn't survive being written to (and immediately read back from)
 * IndexedDB with its full size intact — those are excluded from what's
 * actually persisted, so a resume later never serves up a source already
 * known to be broken; everything else is kept. Never throws for just
 * this reason — only for a harder failure (quota, IndexedDB unavailable)
 * that stops the write entirely. `id`, not just `nom`, so a caller can
 * drop the exact right entry from its own in-memory list even if two
 * sources happen to share the same file name.
 */
export async function saveDraftSources(
  sources: PendingSource[],
): Promise<{ dropped: { id: string; nom: string }[] }> {
  const serialized = await Promise.all(sources.map(serializeSource));

  const db = await openDb();
  try {
    await putRecord(db, serialized);
    const reread = (await getRecord(db)) as SerializedSource[] | undefined;

    const dropped: { id: string; nom: string }[] = [];
    const good = serialized.filter((s, i) => {
      if (isIntact(s, reread?.[i])) return true;
      dropped.push({ id: s.id, nom: s.nom });
      return false;
    });

    if (dropped.length > 0) {
      // Re-write without the corrupted ones so a later read (this same
      // session, or the resume after signup) never serves them back up.
      await putRecord(db, good);
    }

    return { dropped };
  } finally {
    db.close();
  }
}

/**
 * Loads the draft, reconstructing a real File for any PDF/Word kept as
 * raw bytes. Returns null only when there's no draft at all; otherwise
 * `sources` (possibly empty, if everything had to be dropped) plus the
 * id/nom of anything dropped here for failing the same intactness check
 * saveDraftSources already applies — defensive in case corruption
 * happened between saving and this later read (a different IndexedDB
 * session after the redirect through signup is exactly the scenario this
 * whole module exists for).
 */
export async function loadDraftSources(): Promise<
  { sources: PendingSource[]; dropped: { id: string; nom: string }[] } | null
> {
  const db = await openDb();
  try {
    const record = (await getRecord(db)) as SerializedSource[] | undefined;
    if (!record || record.length === 0) return null;

    const dropped: { id: string; nom: string }[] = [];
    const sources: PendingSource[] = [];
    for (const s of record) {
      if (!isIntact(s, s)) {
        // Comparing against itself: still meaningful here, since
        // sourceSizes() also catches a plain 0-byte/empty field
        // regardless of whether it round-tripped from somewhere else.
        dropped.push({ id: s.id, nom: s.nom });
        continue;
      }
      sources.push(deserializeSource(s));
    }

    return { sources, dropped };
  } finally {
    db.close();
  }
}

export async function clearDraftSources(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Suppression du brouillon impossible."));
    });
  } finally {
    db.close();
  }
}
