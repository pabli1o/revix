"use client";

import type { PendingSource } from "./source-picker";

/**
 * Persists the in-progress "Nouvelle fiche" draft (texte/photos/PDF/Word)
 * across a full navigation away from the page — needed for an anonymous
 * visitor sent to /signup (or /login) when they click "Générer la fiche",
 * so their work survives the round trip and the generation can resume
 * automatically once they're authenticated (see creation-flow.tsx).
 *
 * IndexedDB rather than localStorage: a PDF/Word source can carry a raw
 * File up to MAX_DOCUMENT_FILE_BYTES (20 MB, see file-utils.ts) — well
 * past localStorage's tiny string-only quota (~5-10 MB), while IndexedDB
 * stores a Blob/File natively via structured clone, no base64 bloat.
 *
 * Every call can fail (quota exceeded, private-browsing storage
 * restrictions, IndexedDB simply unavailable) — callers must catch and
 * show a clear message rather than crash; nothing here assumes success.
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

export async function saveDraftSources(sources: PendingSource[]): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(sources, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Écriture du brouillon impossible."));
    });
  } finally {
    db.close();
  }
}

export async function loadDraftSources(): Promise<PendingSource[] | null> {
  const db = await openDb();
  try {
    return await new Promise<PendingSource[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      req.onsuccess = () => {
        const value = req.result as PendingSource[] | undefined;
        resolve(value && value.length > 0 ? value : null);
      };
      req.onerror = () => reject(req.error ?? new Error("Lecture du brouillon impossible."));
    });
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
