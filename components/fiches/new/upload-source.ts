"use client";

import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const SOURCE_UPLOADS_BUCKET = "source-uploads";

type UploadMessages = Pick<
  Dictionary["fiches"],
  "fileNotSurvivedDraft" | "fileEmptyAfterStorage" | "sessionNotFound" | "notSignedInYet" | "uploadRejectedByStorage"
>;

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
export async function uploadSourceFile(file: File, t: UploadMessages): Promise<string> {
  if (!(file instanceof File)) {
    // Would otherwise throw a bare "Cannot read properties of undefined
    // (reading 'name')" below — happens if a source's `file`/`files`
    // field somehow didn't survive the IndexedDB round trip as a real
    // File (see local-draft.ts) intact.
    throw new Error(t.fileNotSurvivedDraft);
  }

  if (file.size === 0) {
    // The actual Safari/WebKit failure mode this whole chain guards
    // against (local-draft.ts's round-trip check should already have
    // caught and dropped this earlier — this is the last line of
    // defense, checked before spending a network round trip on a file
    // that Storage would refuse anyway with a much less legible "No
    // content provided").
    throw new Error(t.fileEmptyAfterStorage(file.name));
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(t.sessionNotFound(file.name, userError.message));
  }
  if (!user) {
    throw new Error(t.notSignedInYet(file.name));
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(SOURCE_UPLOADS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) {
    throw new Error(t.uploadRejectedByStorage(file.name, error.message));
  }

  return path;
}
