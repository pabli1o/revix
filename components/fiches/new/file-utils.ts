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
 * PDF/Word aren't recompressed the way photos are (no lossy re-encode
 * available without a heavy PDF-processing dependency), so they're
 * checked against their raw file size — before ever reading them into
 * memory — rather than the post-base64 size used for everything else.
 * ~1.4 MB raw becomes ~1.9 MB once base64-encoded (×4/3), safely under
 * MAX_SINGLE_SOURCE_BYTES with room for one more source alongside it.
 */
export const MAX_RAW_DOCUMENT_BYTES = 1_400_000;

export function estimateBase64Bytes(base64: string): number {
  return base64.length;
}

/** Reads any file as base64 (no "data:" prefix) — used for PDF/Word
 * sources, which aren't compressed, only transported as-is. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
