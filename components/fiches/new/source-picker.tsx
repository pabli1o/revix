"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GenerateSourceInput } from "@/lib/fiches/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { compressImageFile, estimateBase64Bytes, MAX_SINGLE_SOURCE_BYTES, MAX_TOTAL_PAYLOAD_BYTES } from "./file-utils";
import { SOURCE_UPLOADS_BUCKET, uploadSourceFile } from "./upload-source";

function totalPayloadBytes(sources: PendingSource[]): number {
  return sources.reduce(
    (sum, s) => sum + estimateBase64Bytes(s.data ?? "") + (s.texte?.length ?? 0),
    0,
  );
}

export interface PendingSource extends GenerateSourceInput {
  id: string;
  previewUrl?: string;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function SourcePicker({
  sources,
  onChange,
}: {
  sources: PendingSource[];
  onChange: (sources: PendingSource[]) => void;
}) {
  const [textDraft, setTextDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  /**
   * Accumulates newly-picked sources one at a time, rejecting any single
   * source that's too large on its own and stopping early if the running
   * total would exceed what the server can accept in one request (see
   * MAX_TOTAL_PAYLOAD_BYTES in file-utils.ts — a hard, non-configurable
   * platform limit, not something we can raise server-side).
   */
  function tryAddSources(candidates: PendingSource[], preRejected: string[] = []): PendingSource[] {
    const accepted: PendingSource[] = [];
    let runningTotal = totalPayloadBytes(sources);
    const rejected: string[] = [...preRejected];

    for (const candidate of candidates) {
      const size = estimateBase64Bytes(candidate.data ?? "") + (candidate.texte?.length ?? 0);
      if (size > MAX_SINGLE_SOURCE_BYTES) {
        rejected.push(`${candidate.nom} (trop lourd même compressé)`);
        continue;
      }
      if (runningTotal + size > MAX_TOTAL_PAYLOAD_BYTES) {
        rejected.push(`${candidate.nom} (limite totale atteinte)`);
        continue;
      }
      runningTotal += size;
      accepted.push(candidate);
    }

    setSizeError(
      rejected.length > 0
        ? `Non ajouté(s) car trop volumineux pour être envoyés en une fois : ${rejected.join(", ")}. Réduis leur nombre ou leur taille, ou crée une fiche séparée pour le reste.`
        : null,
    );

    return accepted;
  }

  function addText() {
    if (!textDraft.trim()) return;
    onChange([
      ...sources,
      { id: makeId(), type: "texte", nom: "Notes tapées", texte: textDraft.trim() },
    ]);
    setTextDraft("");
  }

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const added: PendingSource[] = [];
      for (const file of Array.from(files)) {
        const { data, mediaType } = await compressImageFile(file);
        added.push({
          id: makeId(),
          type: "photo",
          nom: file.name,
          data,
          mediaType,
          previewUrl: `data:${mediaType};base64,${data}`,
        });
      }
      onChange([...sources, ...tryAddSources(added)]);
    } finally {
      setBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  /**
   * PDF/Word files go straight from the browser to Supabase Storage
   * (uploadSourceFile) instead of being read into memory as base64 and
   * sent through /api/fiches/generate's request body — that body is
   * capped at 4.5 MB by Vercel with no way to raise it, so this is what
   * lets a source file of any size work. Only the short storage path is
   * sent to the generation request, so these never count against the
   * inline-payload budget below (still relevant to photos/text).
   */
  async function handleDocumentFiles(
    files: FileList,
    type: "pdf" | "word",
  ): Promise<PendingSource[]> {
    const failed: string[] = [];
    const added: PendingSource[] = [];
    for (const file of Array.from(files)) {
      try {
        const storagePath = await uploadSourceFile(file);
        added.push({ id: makeId(), type, nom: file.name, storagePath });
      } catch {
        failed.push(`${file.name} (échec de l'envoi)`);
      }
    }
    return tryAddSources(added, failed);
  }

  async function handlePdf(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      onChange([...sources, ...(await handleDocumentFiles(files, "pdf"))]);
    } finally {
      setBusy(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  async function handleWord(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      onChange([...sources, ...(await handleDocumentFiles(files, "word"))]);
    } finally {
      setBusy(false);
      if (wordInputRef.current) wordInputRef.current.value = "";
    }
  }

  function removeSource(id: string) {
    const removed = sources.find((s) => s.id === id);
    if (removed?.storagePath) {
      // Best-effort: an orphaned upload is harmless clutter, not worth
      // blocking or erroring the UI over.
      createClient()
        .storage.from(SOURCE_UPLOADS_BUCKET)
        .remove([removed.storagePath])
        .catch(() => {});
    }
    onChange(sources.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium">Colle ou tape tes notes</p>
        <Textarea
          rows={5}
          value={textDraft}
          onChange={(e) => setTextDraft(e.target.value)}
          placeholder="Colle ici le contenu de ton cours…"
        />
        <Button size="sm" variant="secondary" className="mt-2" onClick={addText}>
          + Ajouter ce texte
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handlePhotos(e.target.files)}
        />
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => photoInputRef.current?.click()}>
          📷 Ajouter des photos
        </Button>

        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(e) => handlePdf(e.target.files)}
        />
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => pdfInputRef.current?.click()}>
          📄 Ajouter un PDF
        </Button>

        <input
          ref={wordInputRef}
          type="file"
          accept=".doc,.docx"
          multiple
          hidden
          onChange={(e) => handleWord(e.target.files)}
        />
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => wordInputRef.current?.click()}>
          📝 Ajouter un Word
        </Button>
      </div>

      {busy && <p className="text-sm text-text-muted">Traitement des fichiers…</p>}
      {sizeError && <p className="text-sm text-danger">{sizeError}</p>}

      {sources.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <span>{ICONS[s.type]}</span>
                <span className="truncate">{s.nom}</span>
              </span>
              <button
                type="button"
                onClick={() => removeSource(s.id)}
                className="ml-3 shrink-0 text-text-muted hover:text-danger"
                aria-label="Retirer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ICONS: Record<PendingSource["type"], string> = {
  texte: "📝",
  photo: "📷",
  pdf: "📄",
  word: "📝",
};
