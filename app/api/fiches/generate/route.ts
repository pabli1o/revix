import { NextResponse } from "next/server";
import type { ClaudeContentBlock } from "@/lib/anthropic/client";
import { generateJson, AiGenerationError } from "@/lib/anthropic/client";
import { FICHE_GENERATION_SYSTEM, validateFicheProposals } from "@/lib/anthropic/prompts";
import { extractTextFromDocx } from "@/lib/files/docx";
import type { GenerateFichesRequest, GenerateFichesResponse } from "@/lib/fiches/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SOURCES = 12;
const SOURCE_UPLOADS_BUCKET = "source-uploads";

/** Downloads a PDF/Word file uploaded straight to Storage (see
 * components/fiches/new/upload-source.ts) and returns its base64 bytes.
 * Scoped to the requesting user's own folder — storagePath is client-
 * supplied, so this refuses to read outside "<userId>/...". */
async function downloadSourceFile(storagePath: string, userId: string): Promise<string> {
  if (!storagePath.startsWith(`${userId}/`)) {
    throw new Error("Fichier introuvable");
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(SOURCE_UPLOADS_BUCKET).download(storagePath);
  if (error || !data) {
    throw new Error("Impossible de récupérer le fichier envoyé");
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  return buffer.toString("base64");
}

// Waiting for the AI lock plus up to 3 retried Claude calls (see
// lib/anthropic/client.ts) can comfortably exceed a platform's default
// serverless duration (10s on Vercel Hobby). Without this, a slow-but-
// legitimate generation gets killed and the client receives a non-JSON
// gateway error instead of our JSON response. 60 is the max allowed on
// Vercel Hobby; raise it if the project is on a plan that allows more.
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as GenerateFichesRequest | null;
  const sources = body?.sources ?? [];

  if (sources.length === 0) {
    return NextResponse.json({ error: "Aucune source fournie" }, { status: 400 });
  }
  if (sources.length > MAX_SOURCES) {
    return NextResponse.json({ error: `Trop de sources (max ${MAX_SOURCES})` }, { status: 400 });
  }

  // Cleaned up in `finally` below regardless of outcome — a storage upload
  // only ever exists to get one file through this one request.
  const uploadedPaths = sources.flatMap((s) => (s.storagePath ? [s.storagePath] : []));

  try {
    const content: ClaudeContentBlock[] = [];

    try {
      for (const source of sources) {
        if (source.type === "texte") {
          if (source.texte?.trim()) {
            content.push({ type: "text", text: `Source "${source.nom}" :\n${source.texte}` });
          }
        } else if (source.type === "photo") {
          if (!source.data) continue;
          const mediaType =
            source.mediaType === "image/png" || source.mediaType === "image/webp"
              ? source.mediaType
              : "image/jpeg";
          content.push({ type: "image", media_type: mediaType, data: source.data });
        } else if (source.type === "pdf") {
          const data = source.storagePath
            ? await downloadSourceFile(source.storagePath, user.id)
            : source.data;
          if (!data) continue;
          content.push({ type: "document", media_type: "application/pdf", data });
        } else if (source.type === "word") {
          const data = source.storagePath
            ? await downloadSourceFile(source.storagePath, user.id)
            : source.data;
          if (!data) continue;
          const text = extractTextFromDocx(Buffer.from(data, "base64"));
          content.push({ type: "text", text: `Source "${source.nom}" :\n${text}` });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de lecture d'une source";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (content.length === 0) {
      return NextResponse.json({ error: "Sources vides ou illisibles" }, { status: 400 });
    }

    try {
      const proposals = await generateJson({
        system: FICHE_GENERATION_SYSTEM,
        content,
        maxTokens: 8000,
        validate: validateFicheProposals,
      });

      const response: GenerateFichesResponse = { proposals };
      return NextResponse.json(response);
    } catch (err) {
      if (err instanceof AiGenerationError) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } finally {
    if (uploadedPaths.length > 0) {
      createAdminClient()
        .storage.from(SOURCE_UPLOADS_BUCKET)
        .remove(uploadedPaths)
        .catch(() => {});
    }
  }
}
