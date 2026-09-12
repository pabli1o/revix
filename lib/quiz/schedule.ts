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
 * waits on 3 sequential AI calls.
 *
 * The 3 generations still run one at a time (never concurrently with each
 * other or with any other Anthropic call, including a fresh fiche
 * generation) because every call goes through the shared AI lock in
 * `lib/anthropic/client.ts`.
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
    for (let i = 0; i < ALL_DIFFICULTIES.length; i++) {
      try {
        await generateAndStoreQuiz(userId, chapterId, ALL_DIFFICULTIES[i]);
      } catch {
        // generateAndStoreQuiz already persists status: 'failed'.
        // The on-demand fallback in the quiz API route will retry later.
      }
      // Deliberate gap between iterations (not just "done, immediately
      // relock"): the AI lock is released the instant one generation
      // finishes, and this loop would otherwise usually win the race to
      // re-acquire it over a genuinely interactive request that's polling
      // for the lock (see lib/anthropic/lock.ts's POLL_INTERVAL_MS) — three
      // background quiz generations back-to-back could then make someone
      // else's fiche/quiz generation queue behind all three in a row,
      // which is a real contributor to the Vercel maxDuration=60s timeout
      // on fiche generation being hit even for small content. This pause
      // gives a waiting interactive request several polling chances to win
      // the lock first; background prefetch is a nice-to-have (the
      // on-demand fallback in get-or-generate.ts covers a not-yet-ready
      // quiz), so it's fine for it to yield.
      if (i < ALL_DIFFICULTIES.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  });
}
