"use client";

import { createClient } from "@/lib/supabase/client";

export const SOURCE_UPLOADS_BUCKET = "source-uploads";

/**
 * Uploads a PDF/Word file straight from the browser to Supabase Storage,
 * bypassing our own Route Handler (and therefore Vercel's non-configurable
 * 4.5 MB request-body limit) entirely — this is what lets fiche generation
 * accept a source file of any size. Returns the storage path to send to
 * /api/fiches/generate instead of the file's raw bytes.
 *
 * Also used, after the fact, to resolve a PDF/Word a visitor added before
 * signing in (see creation-flow.tsx's resolvePendingUploads) — right after
 * a fresh signup/login redirect, so the thrown messages here are the ones
 * most likely to surface that specific "brouillon → inscription → retour"
 * bug report: distinguished from a generic failure so it's clear from the
 * message alone which of (a) the browser-stored File didn't survive the
 * round trip, (b) the session isn't actually active yet, or (c) Storage
 * itself rejected the upload (bucket/RLS) is the actual cause.
 */
export async function uploadSourceFile(file: File): Promise<string> {
  if (!(file instanceof File)) {
    // Would otherwise throw a bare "Cannot read properties of undefined
    // (reading 'name')" below — happens if a source's `file`/`files`
    // field somehow didn't survive the IndexedDB round trip as a real
    // File (see local-draft.ts) intact.
    throw new Error(
      "Le fichier n'a pas survécu au brouillon enregistré dans ce navigateur — ajoute-le à nouveau.",
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(`Session introuvable pour envoyer « ${file.name} » : ${userError.message}`);
  }
  if (!user) {
    throw new Error(
      `Pas encore connecté — impossible d'envoyer « ${file.name} ». Réessaie dans un instant ou reconnecte-toi.`,
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(SOURCE_UPLOADS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) {
    throw new Error(`Envoi de « ${file.name} » refusé par le stockage : ${error.message}`);
  }

  return path;
}
