import "server-only";

import { generateJson } from "@/lib/anthropic/client";
import {
  buildQuizSystemPrompt,
  shuffleQuizQuestions,
  validateQuizGeneration,
} from "@/lib/anthropic/prompts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizDifficulty, QuizQuestion } from "@/lib/supabase/database.types";
import { getChapterContent } from "./content";

/**
 * Generates (or regenerates) the quiz for one chapter/difficulty pair,
 * grounded strictly in the chapter's current fiche content, and persists
 * it as `status: 'ready'`. Used both by the background scheduler
 * (triggered via `after()` on fiche save) and by the on-demand fallback
 * when a client asks for a quiz that isn't ready yet.
 */
export async function generateAndStoreQuiz(
  userId: string,
  chapterId: string,
  difficulty: QuizDifficulty,
): Promise<QuizQuestion[]> {
  const admin = createAdminClient();
  const { text, latestFicheUpdatedAt } = await getChapterContent(chapterId);

  if (!text.trim()) {
    throw new Error("Ce chapitre ne contient aucune fiche à partir de laquelle générer un quiz.");
  }

  try {
    const raw = await generateJson({
      userId,
      system: buildQuizSystemPrompt(difficulty),
      content: [{ type: "text", text }],
      maxTokens: 4000,
      validate: validateQuizGeneration,
    });

    const questions = shuffleQuizQuestions(raw);

    await admin.from("quizzes").upsert(
      {
        user_id: userId,
        chapter_id: chapterId,
        difficulty,
        status: "ready",
        questions,
        source_fiches_updated_at: latestFicheUpdatedAt,
      },
      { onConflict: "user_id,chapter_id,difficulty" },
    );

    return questions;
  } catch (err) {
    await admin.from("quizzes").upsert(
      {
        user_id: userId,
        chapter_id: chapterId,
        difficulty,
        status: "failed",
      },
      { onConflict: "user_id,chapter_id,difficulty" },
    );
    throw err;
  }
}
