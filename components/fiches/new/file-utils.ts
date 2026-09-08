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
