/** Shared, import-safe constants for the subscription gate — no
 * "server-only" import here so client components (e.g. the fiche viewer's
 * progressive-blur rendering) can import `FREE_PREVIEW_SENTENCES` without
 * pulling in server-only/admin-client code transitively. */

/** Anthropic bills in USD; the cap and top-up are marketed in EUR. Fixed
 * approximate rate rather than a live FX lookup — simpler, no external
 * dependency, and precise enough for a soft usage cap. Revisit
 * periodically if EUR/USD moves a lot. */
export const USD_PER_EUR = 1.08;

/** Real Claude API cost (fiche + quiz generation combined, computed from
 * response.usage — see lib/anthropic/client.ts), per billing period, for
 * active subscribers only. Generation is blocked once reached; unlimited
 * for non-subscribers is unchanged (this cap never applied to them). */
export const MONTHLY_AI_BUDGET_EUR = 3.5;
export const MONTHLY_AI_BUDGET_USD = MONTHLY_AI_BUDGET_EUR * USD_PER_EUR;

/** One-time Stripe payment (not a subscription) that unlocks extra budget
 * for the rest of the current billing period only — it does not roll over. */
export const EXTRA_CREDIT_PRICE_EUR = 9.99;
export const EXTRA_CREDIT_BUDGET_EUR = 4.99;
export const EXTRA_CREDIT_BUDGET_USD = EXTRA_CREDIT_BUDGET_EUR * USD_PER_EUR;

/** Sentences shown in clear before the progressive blur kicks in for
 * non-subscribers. */
export const FREE_PREVIEW_SENTENCES = 2;
