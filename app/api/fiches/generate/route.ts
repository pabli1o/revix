import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { ClaudeContentBlock } from "@/lib/anthropic/client";
import { submitBatch } from "@/lib/anthropic/client";
import { FICHE_GENERATION_SYSTEM } from "@/lib/anthropic/prompts";
import { extractTextFromDocx } from "@/lib/files/docx";
import type { GenerateFichesRequest, GenerateFichesResponse } from "@/lib/fiches/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAiUsageBudgetAvailable, AiUsageCapExceededError } from "@/lib/subscription/gate";
import { elapsedMs, logStep, startTimer } from "@/lib/observability/timing";

const MAX_SOURCES = 12;
const SOURCE_UPLOADS_BUCKET = "source-uploads";

/** Downloads a PDF/Word file uploaded straight to Storage (see
 * components/fiches/new/upload-source.ts) and returns its base64 bytes.
 * Scoped to the requesting user's own folder — storagePath is client-
 * supplied, so this refuses to read outside "<userId>/...". */
async function downloadSourceFile(storagePath: string, userId: string, tag: string): Promise<string> {
  if (!storagePath.startsWith(`${userId}/`)) {
    throw new Error("Fichier introuvable");
  }
  const started = startTimer();
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(SOURCE_UPLOADS_BUCKET).download(storagePath);
  if (error || !data) {
    throw new Error("Impossible de récupérer le fichier envoyé");
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  logStep(tag, `storage download (${storagePath}) — ${elapsedMs(started)}ms, ${buffer.length} bytes`);
  return buffer.toString("base64");
}

/**
 * Submits one Anthropic Message Batch for this chunk of sources and
 * returns immediately with a job id — the actual generation now happens
 * fully on Anthropic's infrastructure (see lib/anthropic/client.ts's
 * submitBatch/checkBatch), polled via GET /api/fiches/generate/[jobId].
 * This route itself only reads the sources and submits the batch, both
 * fast, so it no longer needs the extended maxDuration or the AI lock the
 * old synchronous version required.
 */
export async function POST(request: Request) {
  const requestTag = `fiches-submit:${randomUUID().slice(0, 8)}`;
  const requestStarted = startTimer();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as GenerateFichesRequest | null;
  const sources = body?.sources ?? [];

  logStep(
    requestTag,
    `request received — ${sources.length} source(s): ${sources.map((s) => s.type).join(", ") || "none"}`,
  );

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
    try {
      await assertAiUsageBudgetAvailable(user.id);
    } catch (err) {
      if (err instanceof AiUsageCapExceededError) {
        const response: GenerateFichesResponse = { error: err.message, aiUsageCapExceeded: true };
        return NextResponse.json(response, { status: 402 });
      }
      throw err;
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
          const data = source.storagePath
            ? await downloadSourceFile(source.storagePath, user.id, requestTag)
            : source.data;
          if (!data) continue;
          content.push({ type: "document", media_type: "application/pdf", data });
        } else if (source.type === "word") {
          const data = source.storagePath
            ? await downloadSourceFile(source.storagePath, user.id, requestTag)
            : source.data;
          if (!data) continue;
          const docxStarted = startTimer();
          const text = extractTextFromDocx(Buffer.from(data, "base64"));
          logStep(requestTag, `docx text extraction — ${elapsedMs(docxStarted)}ms`);
          content.push({ type: "text", text: `Source "${source.nom}" :\n${text}` });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de lecture d'une source";
      logStep(requestTag, `request FAILED (source read) after ${elapsedMs(requestStarted)}ms — ${message}`);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (content.length === 0) {
      return NextResponse.json({ error: "Sources vides ou illisibles" }, { status: 400 });
    }

    try {
      const batchId = await submitBatch({
        system: FICHE_GENERATION_SYSTEM,
        content,
        maxTokens: 8000,
        label: "fiche-batch",
      });

      const admin = createAdminClient();
      const { data: job, error: insertError } = await admin
        .from("fiche_generation_jobs")
        .insert({ user_id: user.id, status: "pending", anthropic_batch_id: batchId })
        .select("id")
        .single();

      if (insertError || !job) {
        logStep(requestTag, `request FAILED (job insert) after ${elapsedMs(requestStarted)}ms`);
        return NextResponse.json({ error: "Impossible de préparer la génération" }, { status: 500 });
      }

      logStep(requestTag, `request done — total ${elapsedMs(requestStarted)}ms, job=${job.id}`);
      const response: GenerateFichesResponse = { jobId: job.id };
      return NextResponse.json(response);
    } catch (err) {
      logStep(
        requestTag,
        `request FAILED (batch submit) after ${elapsedMs(requestStarted)}ms — ${err instanceof Error ? err.message : String(err)}`,
      );
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return NextResponse.json({ error: message }, { status: 502 });
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
