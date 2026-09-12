import "server-only";

/**
 * Minimal server-side timing log for diagnosing where time actually goes
 * during fiche/quiz generation (lock wait vs. Claude call time vs.
 * retries vs. source download) — plain console.log, which Vercel already
 * captures in its function logs, rather than a new observability
 * dependency/service this app doesn't otherwise need. Every call site
 * shares a `tag` (see lib/anthropic/client.ts's per-generation requestId)
 * so every line for one generation can be found together by searching the
 * Vercel logs for that tag.
 */
export function logStep(tag: string, message: string): void {
  console.log(`[${tag}] ${message}`);
}

export function startTimer(): number {
  return Date.now();
}

export function elapsedMs(since: number): number {
  return Date.now() - since;
}
