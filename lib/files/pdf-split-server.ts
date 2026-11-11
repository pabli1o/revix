import "server-only";

import { PDFDocument } from "pdf-lib";

/**
 * Server-side counterpart to components/fiches/new/pdf-split.ts's
 * splitPdfByPages — used only as a safety net when a PDF chunk the client
 * already pre-split to ≤8 pages (PDF_PAGES_PER_CHUNK) still truncates
 * generation (see lib/anthropic/fiche-split-retry.ts), not on the main
 * upload path. Splits a base64-encoded PDF into two roughly equal halves
 * by page count. Returns null if the PDF has only one page (nothing left
 * to split) or can't be parsed (encrypted, corrupted) — the caller must
 * then surface the truncation as-is instead of splitting further.
 */
export async function splitPdfBase64InHalf(base64: string): Promise<[string, string] | null> {
  try {
    const bytes = Buffer.from(base64, "base64");
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();
    if (totalPages <= 1) return null;

    const mid = Math.ceil(totalPages / 2);
    const ranges = [
      Array.from({ length: mid }, (_, i) => i),
      Array.from({ length: totalPages - mid }, (_, i) => mid + i),
    ];

    const halves = await Promise.all(
      ranges.map(async (indices) => {
        const subDoc = await PDFDocument.create();
        const copiedPages = await subDoc.copyPages(srcDoc, indices);
        copiedPages.forEach((page) => subDoc.addPage(page));
        const subBytes = await subDoc.save();
        return Buffer.from(subBytes).toString("base64");
      }),
    );

    return [halves[0], halves[1]];
  } catch {
    return null;
  }
}
