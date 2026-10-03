"use client";

import { PDFDocument } from "pdf-lib";

export interface PdfPart {
  file: File;
  label: string;
}

/**
 * Splits a PDF into page-range sub-files entirely in the browser. pdf-lib
 * is pure JS with no native bindings, so this runs with no serverless
 * duration ceiling to worry about — unlike anything that would run inside
 * a Vercel function. Each part is then uploaded and sent to
 * /api/fiches/generate as its own independent source (see
 * creation-flow.tsx), processed in parallel instead of as one long call
 * for the whole document.
 *
 * Returns null (caller falls back to uploading the whole file unsplit) if
 * the PDF is small enough to not need splitting, or can't be parsed
 * (encrypted, corrupted, unusual structure) — a parse failure shouldn't
 * block the user over a file Claude itself might still read fine.
 */
export async function splitPdfByPages(file: File, pagesPerChunk: number): Promise<PdfPart[] | null> {
  try {
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();
    if (totalPages <= pagesPerChunk) return null;

    const baseName = file.name.replace(/\.pdf$/i, "");
    const parts: PdfPart[] = [];

    for (let start = 0; start < totalPages; start += pagesPerChunk) {
      const end = Math.min(start + pagesPerChunk, totalPages);
      const indices = Array.from({ length: end - start }, (_, i) => start + i);

      const subDoc = await PDFDocument.create();
      const copiedPages = await subDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((page) => subDoc.addPage(page));
      // Re-wrapped into a fresh Uint8Array: pdf-lib's save() result types as
      // Uint8Array<ArrayBufferLike>, which TS's DOM lib won't accept as a
      // BlobPart (it wants ArrayBuffer, not the wider ArrayBufferLike) —
      // this copy is backed by a plain ArrayBuffer and satisfies it.
      const subBytes = new Uint8Array(await subDoc.save());

      parts.push({
        file: new File([subBytes], `${baseName} (p.${start + 1}-${end}).pdf`, {
          type: "application/pdf",
        }),
        label: `p.${start + 1}-${end}`,
      });
    }

    return parts;
  } catch {
    return null;
  }
}

/** Returns the PDF's page count, or null if it can't be parsed (same
 * fallback behavior as splitPdfByPages — caller treats null as "let it
 * through unsplit" rather than blocking the user). */
export async function getPdfPageCount(file: File): Promise<number | null> {
  try {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    return null;
  }
}
