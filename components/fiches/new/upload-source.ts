"use client";

import { createClient } from "@/lib/supabase/client";

export const SOURCE_UPLOADS_BUCKET = "source-uploads";

/**
 * Uploads a PDF/Word file straight from the browser to Supabase Storage,
 * bypassing our own Route Handler (and therefore Vercel's non-configurable
 * 4.5 MB request-body limit) entirely — this is what lets fiche generation
 * accept a source file of any size. Returns the storage path to send to
 * /api/fiches/generate instead of the file's raw bytes.
 */
export async function uploadSourceFile(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(SOURCE_UPLOADS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;

  return path;
}
