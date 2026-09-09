import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Global, app-wide lock serializing every call made to the Anthropic API.
 *
 * The spec requires that fiche generation and quiz generation NEVER run
 * concurrently, anywhere in the app, for any user. A single row in
 * `public.ai_lock`, updated with a conditional `UPDATE ... WHERE`, gives us
 * that guarantee even when Postgres connections come from a
 * transaction-mode pooler (Supavisor/pgbouncer), where session-level
 * primitives like `pg_advisory_lock` are not reliable.
 */

const LOCK_STALE_AFTER_SECONDS = 120;
const POLL_INTERVAL_MS = 500;

export class AiLockTimeoutError extends Error {
  constructor() {
    super("Une autre génération est déjà en cours, réessaie dans un instant.");
    this.name = "AiLockTimeoutError";
  }
}

async function tryAcquire(holder: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("try_acquire_ai_lock", {
    holder,
    stale_after_seconds: LOCK_STALE_AFTER_SECONDS,
  });
  if (error) {
    throw new Error(`Erreur lors de la préparation de la génération : ${error.message}`);
  }
  return data === true;
}

async function release(holder: string): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("release_ai_lock", { holder });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Acquires the global AI lock (waiting/polling up to `maxWaitMs`), runs `fn`,
 * then always releases the lock. Ensures only one Anthropic call is ever
 * in flight app-wide, whether it's a fiche generation, a quiz generation,
 * or a background prefetch triggered via `after()`.
 */
export async function withAiLock<T>(fn: () => Promise<T>, maxWaitMs = 90_000): Promise<T> {
  const holder = randomUUID();
  const deadline = Date.now() + maxWaitMs;

  let acquired = await tryAcquire(holder);
  while (!acquired) {
    if (Date.now() > deadline) {
      throw new AiLockTimeoutError();
    }
    await sleep(POLL_INTERVAL_MS);
    acquired = await tryAcquire(holder);
  }

  try {
    return await fn();
  } finally {
    await release(holder);
  }
}
