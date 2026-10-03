import { NextResponse } from "next/server";
import { checkBatch } from "@/lib/anthropic/client";
import { validateFicheProposals } from "@/lib/anthropic/prompts";
import type { FicheGenerationJobStatusResponse } from "@/lib/fiches/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Polled by creation-flow.tsx while a fiche-generation batch job (created
 * by POST /api/fiches/generate) is still 'pending'. Mirrors the on-demand
 * finalization in lib/quiz/get-or-generate.ts: the DB row is the source of
 * truth once it says 'ready'/'failed', and only consulted against
 * Anthropic (via checkBatch) while still 'pending' — once a batch has
 * ended, that result is persisted here so later polls (and other tabs/
 * devices) never need to re-check Anthropic for the same job again.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: job } = await supabase
    .from("fiche_generation_jobs")
    .select("status, anthropic_batch_id, proposals, error")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "Génération introuvable" }, { status: 404 });
  }

  if (job.status !== "pending") {
    const response: FicheGenerationJobStatusResponse = {
      status: job.status,
      proposals: job.proposals ?? undefined,
      error: job.error ?? undefined,
    };
    return NextResponse.json(response);
  }

  if (!job.anthropic_batch_id) {
    return NextResponse.json({ status: "pending" } satisfies FicheGenerationJobStatusResponse);
  }

  const result = await checkBatch(job.anthropic_batch_id, user.id, validateFicheProposals);

  if (result.status === "pending") {
    return NextResponse.json({ status: "pending" } satisfies FicheGenerationJobStatusResponse);
  }

  const admin = createAdminClient();

  if (result.status === "ready") {
    await admin
      .from("fiche_generation_jobs")
      .update({ status: "ready", proposals: result.value })
      .eq("id", jobId);
    const response: FicheGenerationJobStatusResponse = { status: "ready", proposals: result.value };
    return NextResponse.json(response);
  }

  await admin.from("fiche_generation_jobs").update({ status: "failed", error: result.error }).eq("id", jobId);
  const response: FicheGenerationJobStatusResponse = { status: "failed", error: result.error };
  return NextResponse.json(response);
}
