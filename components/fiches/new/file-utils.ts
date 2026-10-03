"use client";

/** Loads a File as an HTMLImageElement, decoded and ready to draw. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Client-side photo compression: downscales to at most `maxDim` on the
 * longest side and re-encodes as JPEG at `quality`, before the photo is
 * ever uploaded — required by the spec ("Compress images client-side
 * before upload").
 */
export async function compressImageFile(
  file: File,
  maxDim = 1600,
  quality = 0.75,
): Promise<{ data: string; mediaType: "image/jpeg" }> {
  const img = await loadImage(file);
  let { width, height } = img;

  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de compresser l'image (canvas indisponible)");
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { data: dataUrl.split(",")[1] ?? "", mediaType: "image/jpeg" };
}

/**
 * Vercel's Node.js serverless functions (what our Route Handlers run on)
 * reject any request body over 4.5 MB with a platform-level 413 — this
 * cannot be raised via Next.js config, so the only fix is keeping what we
 * send comfortably under it. Budget in base64 characters (≈ bytes, since
 * base64 is ASCII); left well under 4.5 MB to leave headroom for the rest
 * of the JSON payload, multiple sources, and request/cookie overhead.
 */
export const MAX_TOTAL_PAYLOAD_BYTES = 2_500_000;
/** A single source over this is almost certainly going to blow the total
 * budget on its own — reject it immediately with a clear reason instead of
 * silently adding it and failing later at submit time. */
export const MAX_SINGLE_SOURCE_BYTES = 2_000_000;

/**
 * PDF/Word files bypass MAX_SINGLE_SOURCE_BYTES entirely — they go straight
 * to Supabase Storage (see upload-source.ts) rather than through the
 * base64-in-JSON path that limit was written for, and are never reduced to
 * a `.data` field client-side, so the size check in source-picker.tsx's
 * tryAddSources() silently saw 0 bytes for them and let anything through.
 * This is the limit enforced instead, checked against file.size *before*
 * uploadSourceFile() ever starts — Claude's own PDF limits are 32 MB /
 * 600 pages, and a huge file would otherwise upload successfully (taking
 * real time) only to fail later, deep into generation, downloading
 * server-side or hitting that API limit.
 */
export const MAX_DOCUMENT_FILE_BYTES = 20_000_000;

/**
 * A large PDF is split client-side into independent page-range sub-files
 * (see pdf-split.ts), each sent and generated in parallel instead of one
 * long sequential call for the whole document — this is what keeps a
 * big PDF both fast (parallel, not sequential) and safe from a function
 * duration timeout (every sub-call is small) without waiting on it as a
 * single slow unit. PDF_PAGES_PER_CHUNK is the target size per sub-file;
 * MAX_PDF_PAGES is a hard upfront guard that rejects a truly extreme PDF
 * with a clear message instead of silently firing dozens of parallel
 * calls (cost, Anthropic rate limits) for what's very unlikely to be a
 * normal "cours" document at that length.
 */
export const PDF_PAGES_PER_CHUNK = 8;
export const MAX_PDF_PAGES = 150;

export function estimateBase64Bytes(base64: string): number {
  return base64.length;
}

/** Each generation call is kept well under the total per-session upload
 * budget above, so a batch of several photos/texts still finishes
 * comfortably inside Vercel's 60s function duration instead of risking a
 * timeout on one giant combined call — see chunkSources below and
 * creation-flow.tsx, which sends one /api/fiches/generate request per
 * chunk instead of one request for every source at once. */
export const MAX_CHUNK_PAYLOAD_BYTES = 1_000_000;
export const MAX_CHUNK_SOURCES = 4;

/**
 * Splits sources into smaller groups, each meant to be sent as its own
 * generation request. A pdf/word source is always isolated in its own
 * chunk: its real size isn't known client-side (it went straight to
 * Supabase Storage — see upload-source.ts — so only a storagePath
 * reference exists here, not the file's bytes), and Claude's native PDF
 * support renders every page as an image internally, so a multi-page PDF
 * can be slow to process regardless of its file size — isolating it at
 * least stops it from compounding with other sources in the same call.
 * texte/photo sources (already bounded by MAX_TOTAL_PAYLOAD_BYTES /
 * MAX_SINGLE_SOURCE_BYTES above) are batched together up to
 * MAX_CHUNK_PAYLOAD_BYTES or MAX_CHUNK_SOURCES, whichever comes first.
 *
 * A large PDF is no longer a single opaque chunk by the time it reaches
 * here: source-picker.tsx already split it into page-range sub-files (see
 * pdf-split.ts), each arriving as its own "pdf" source — so what looks
 * like one very large PDF is already several independent, isolated
 * chunks below. Word documents aren't split (their text is extracted
 * server-side after download, cheaply, regardless of length), so a single
 * very large Word file is still one opaque chunk here.
 */
export function chunkSources<T extends { type: string; data?: string; texte?: string }>(
  sources: T[],
): T[][] {
  const chunks: T[][] = [];
  let current: T[] = [];
  let currentBytes = 0;

  function flush() {
    if (current.length > 0) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
  }

  for (const source of sources) {
    if (source.type === "pdf" || source.type === "word") {
      flush();
      chunks.push([source]);
      continue;
    }

    const size = estimateBase64Bytes(source.data ?? "") + (source.texte?.length ?? 0);
    if (current.length >= MAX_CHUNK_SOURCES || currentBytes + size > MAX_CHUNK_PAYLOAD_BYTES) {
      flush();
    }
    current.push(source);
    currentBytes += size;
  }
  flush();

  return chunks;
}
