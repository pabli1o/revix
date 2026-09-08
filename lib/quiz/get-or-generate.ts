import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizDifficulty, QuizQuestion } from "@/lib/supabase/database.types";
import { getChapterContent } from "./content";
import { generateAndStoreQuiz } from "./generate";

const PENDING_POLL_INTERVAL_MS = 1000;
const PENDING_POLL_MAX_MS = 20_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the ready quiz questions for a chapter/difficulty, instantly if
 * they were already pre-generated in the background (see
 * lib/quiz/schedule.ts). If they aren't ready yet — still `pending`
 * (background job in flight), stale (fiches changed since), missing, or
 * `failed` — falls back to generating on demand.
 */
export async function getOrGenerateQuiz(
  userId: string,
  chapterId: string,
  difficulty: QuizDifficulty,
): Promise<QuizQuestion[]> {
  const admin = createAdminClient();

  const { data: quiz } = await admin
    .from("quizzes")
    .select("status, questions, source_fiches_updated_at")
    .eq("user_id", userId)
    .eq("chapter_id", chapterId)
    .eq("difficulty", difficulty)
    .maybeSingle();

  const { latestFicheUpdatedAt } = await getChapterContent(chapterId);
  const isFresh = quiz?.source_fiches_updated_at === latestFicheUpdatedAt;

  if (quiz?.status === "ready" && isFresh && quiz.questions.length === 10) {
    return quiz.questions;
  }

  if (quiz?.status === "pending" && isFresh) {
    // The background job (triggered on fiche save) is presumably about to
    // finish — poll briefly instead of racing it with a second AI call.
    const deadline = Date.now() + PENDING_POLL_MAX_MS;
    while (Date.now() < deadline) {
      await sleep(PENDING_POLL_INTERVAL_MS);
      const { data: refreshed } = await admin
        .from("quizzes")
        .select("status, questions")
        .eq("user_id", userId)
        .eq("chapter_id", chapterId)
        .eq("difficulty", difficulty)
        .maybeSingle();
      if (refreshed?.status === "ready" && refreshed.questions.length === 10) {
        return refreshed.questions;
      }
      if (refreshed?.status === "failed") break;
    }
  }

  // On-demand fallback: generate now.
  return generateAndStoreQuiz(userId, chapterId, difficulty);
}
