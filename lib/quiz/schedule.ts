import "server-only";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizDifficulty } from "@/lib/supabase/database.types";
import { generateAndStoreQuiz } from "./generate";

const ALL_DIFFICULTIES: QuizDifficulty[] = ["facile", "moyen", "difficile"];

/**
 * Called right after a fiche is saved. Marks all 3 difficulty quizzes for
 * the chapter as `pending` immediately (so the UI can reflect "en cours de
 * préparation"), then uses `after()` to actually generate them in the
 * background once the response has been sent — so saving a fiche never
 * waits on 3 AI calls.
 *
 * The 3 generations run one after another, simply because this loop
 * awaits each in turn — not because of any app-wide serialization (there
 * is none: generateJson's calls run independently of each other and of
 * any other Anthropic call, including an interactive fiche generation's
 * own parallel chunks — see lib/anthropic/client.ts). Kept sequential
 * here anyway since nothing is waiting on this background prefetch (the
 * on-demand fallback in get-or-generate.ts covers a not-yet-ready quiz),
 * so there's no reason to spend the extra concurrent Anthropic traffic on
 * it.
 */
export async function scheduleQuizPreparation(userId: string, chapterId: string): Promise<void> {
  const admin = createAdminClient();

  await Promise.all(
    ALL_DIFFICULTIES.map((difficulty) =>
      admin.from("quizzes").upsert(
        {
          user_id: userId,
          chapter_id: chapterId,
          difficulty,
          status: "pending",
        },
        { onConflict: "user_id,chapter_id,difficulty" },
      ),
    ),
  );

  after(async () => {
    for (const difficulty of ALL_DIFFICULTIES) {
      try {
        await generateAndStoreQuiz(userId, chapterId, difficulty);
      } catch {
        // generateAndStoreQuiz already persists status: 'failed'.
        // The on-demand fallback in the quiz API route will retry later.
      }
    }
  });
}
