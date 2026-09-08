import "server-only";

import { inflateRawSync } from "node:zlib";

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

interface ZipEntry {
  name: string;
  data: Buffer;
}

/**
 * Minimal ZIP reader (no external dependency) good enough to pull a single
 * named entry out of a .docx file. Word always writes local file headers
 * with explicit compressed/uncompressed sizes (no streaming data
 * descriptors), so we don't need to support that case.
 */
function readZipEntries(buffer: Buffer, wantedNames: Set<string>): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 4 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== LOCAL_FILE_HEADER_SIGNATURE) break;

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);

    const nameStart = offset + 30;
    const name = buffer.toString("utf-8", nameStart, nameStart + fileNameLength);
    const dataStart = nameStart + fileNameLength + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (wantedNames.has(name)) {
      const raw = buffer.subarray(dataStart, dataEnd);
      const data = compressionMethod === 0 ? Buffer.from(raw) : inflateRawSync(raw);
      entries.push({ name, data });
    }

    offset = dataEnd;
  }

  return entries;
}

function xmlToText(xml: string): string {
  return xml
    // Paragraph and line breaks become newlines
    .replace(/<w:p\b[^>]*>/g, "\n")
    .replace(/<w:br\s*\/>/g, "\n")
    .replace(/<w:tab\s*\/>/g, "\t")
    // Strip every remaining tag
    .replace(/<[^>]+>/g, "")
    // Decode the handful of entities Word actually emits
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * Extracts plain text from a .docx file buffer, for feeding into the AI
 * generation prompt alongside typed text, photos and PDFs.
 */
export function extractTextFromDocx(buffer: Buffer): string {
  const entries = readZipEntries(buffer, new Set(["word/document.xml"]));
  const documentXml = entries.find((e) => e.name === "word/document.xml");
  if (!documentXml) {
    throw new Error("Fichier .docx invalide : word/document.xml introuvable");
  }
  return xmlToText(documentXml.data.toString("utf-8"));
}
