import { NextResponse, type NextRequest } from "next/server";
import { AiGenerationError } from "@/lib/anthropic/client";
import { getOrGenerateQuiz } from "@/lib/quiz/get-or-generate";
import type { QuizDifficulty } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { AiUsageCapExceededError } from "@/lib/subscription/gate";

const VALID_DIFFICULTIES: QuizDifficulty[] = ["facile", "moyen", "difficile"];

// See app/api/fiches/generate/route.ts for why this is needed: the
// on-demand fallback path here can wait on the AI lock and run a full
// (retried) Claude generation, which can exceed the platform's default
// serverless duration.
export const maxDuration = 60;

export async function GET(request: NextRequest, ctx: RouteContext<"/api/quiz/[chapterId]">) {
  const { chapterId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const difficulty = request.nextUrl.searchParams.get("difficulty") as QuizDifficulty | null;
  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "Difficulté invalide" }, { status: 400 });
  }

  // Confirm the chapter belongs to this user (RLS-scoped read).
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("id", chapterId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!chapter) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });

  try {
    const questions = await getOrGenerateQuiz(user.id, chapterId, difficulty);
    // Never leak the correct answer position ordering logic — but the
    // client does need it to grade instantly, so we still send reponseIndex;
    // what matters (per spec) is that it was shuffled server-side, not that
    // it's hidden from the payload.
    return NextResponse.json({ questions });
  } catch (err) {
    if (err instanceof AiUsageCapExceededError) {
      return NextResponse.json({ error: err.message, aiUsageCapExceeded: true }, { status: 402 });
    }
    if (err instanceof AiGenerationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
