import { NextResponse } from "next/server";
import type { ClaudeContentBlock } from "@/lib/anthropic/client";
import { generateJson, AiGenerationError } from "@/lib/anthropic/client";
import { FICHE_GENERATION_SYSTEM, validateFicheProposals } from "@/lib/anthropic/prompts";
import { extractTextFromDocx } from "@/lib/files/docx";
import type { GenerateFichesRequest, GenerateFichesResponse } from "@/lib/fiches/types";
import { createClient } from "@/lib/supabase/server";

const MAX_SOURCES = 12;

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
        if (!source.data) continue;
        content.push({ type: "document", media_type: "application/pdf", data: source.data });
      } else if (source.type === "word") {
        if (!source.data) continue;
        const text = extractTextFromDocx(Buffer.from(source.data, "base64"));
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
}
