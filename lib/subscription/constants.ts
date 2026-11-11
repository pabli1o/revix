/** Shared, import-safe constants for the subscription gate — no
 * "server-only" import here so client components (the fiche viewer's
 * progressive-blur rendering, the pricing cards) can import from this file
 * without pulling in server-only/admin-client code transitively. */

/** Anthropic bills in USD; credits are sold in EUR. Fixed approximate rate
 * rather than a live FX lookup — simpler, no external dependency, and
 * precise enough for a soft usage cap. Revisit periodically if EUR/USD
 * moves a lot. */
export const USD_PER_EUR = 1.08;

/** Internal-only conversion between the credits shown to users and the
 * real EUR/USD budget enforced against Claude's response.usage cost —
 * never exposed in any UI copy. Per the display rules, credits are the
 * only unit a user ever sees; no euro amount is ever shown alongside them. */
const CREDITS_PER_EUR = 1000;

import type { SubscriptionTier } from "@/lib/supabase/database.types";
export type { SubscriptionTier };

export interface TierFeatures {
  quiz: boolean;
  planning: boolean;
  /** Unlike quiz/planning, examen used to be granted to any active
   * subscription regardless of tier — now tier-gated too, specifically so
   * tier0 (the fiches-only entry tier) excludes it like an unsubscribed
   * visitor. See app/(app)/examen/page.tsx and app/api/exams/*. */
  examen: boolean;
}

export interface TierConfig {
  label: string;
  priceEur: number;
  credits: number;
  /** Real Claude API cost (fiche + quiz generation combined, computed from
   * response.usage — see lib/anthropic/client.ts) this tier's credits
   * convert to, per billing period. Generation is blocked once reached;
   * it never rolls over and is reset on every renewal. */
  budgetUsd: number;
  features: TierFeatures;
  /** Rough "how much does this get me" range shown next to the credit
   * count on the pricing cards — fiche generation ALONE, not counting
   * quiz (quiz draws from the same monthly credit pool on tiers where
   * features.quiz is true, and a quiz-heavy user will see noticeably
   * fewer fiches than this range before hitting the cap). Indicative
   * only — real cost per fiche varies a lot with source type (photo vs.
   * PDF) and length — never update this without re-deriving it from
   * lib/anthropic/fiche-split-retry.ts's live model/effort/pricing
   * constants, since it isn't computed from them automatically. */
  estimatedFiches: { min: number; max: number };
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  tier0: {
    label: "Fiches",
    priceEur: 4.99,
    credits: 500,
    budgetUsd: (500 / CREDITS_PER_EUR) * USD_PER_EUR,
    features: { quiz: false, planning: false, examen: false },
    estimatedFiches: { min: 5, max: 8 },
  },
  tier1: {
    label: "Complet",
    priceEur: 9.99,
    credits: 1500,
    budgetUsd: (1500 / CREDITS_PER_EUR) * USD_PER_EUR,
    features: { quiz: true, planning: true, examen: true },
    // Re-derived from a measured side-by-side test (claude-sonnet-5-5,
    // effort "low", see lib/anthropic/fiche-split-retry.ts) rather than
    // the old claude-opus-5/medium figure. Kept conservative relative to
    // the single test course measured (≈61 fiches/1500cr on a dense
    // 23-page course) — see the comment on TierConfig.estimatedFiches for
    // why this can't be derived automatically, and the doc comment above
    // about quiz usage eating into the same pool on this tier.
    estimatedFiches: { min: 10, max: 15 },
  },
  tier2: {
    label: "Complet+",
    priceEur: 19.99,
    credits: 4000,
    budgetUsd: (4000 / CREDITS_PER_EUR) * USD_PER_EUR,
    features: { quiz: true, planning: true, examen: true },
    estimatedFiches: { min: 20, max: 25 },
  },
  // Kept configured (same price/credits/features it always had) so an
  // existing tier3 subscriber keeps exactly their current access — just
  // removed from TIER_ORDER below, so it no longer appears on the pricing
  // page or in the upgrade modal for anyone picking a new plan.
  tier3: {
    label: "Complet+",
    priceEur: 39.99,
    credits: 9000,
    budgetUsd: (9000 / CREDITS_PER_EUR) * USD_PER_EUR,
    features: { quiz: true, planning: true, examen: true },
    estimatedFiches: { min: 35, max: 45 },
  },
};

export const TIER_ORDER: SubscriptionTier[] = ["tier0", "tier1", "tier2"];

/** One-time (non-recurring) credit top-up, on top of whichever tier the
 * subscriber is already on — unlike a tier, it's a single Whop purchase,
 * not a plan, and it never rolls over (reset to 0 on the next renewal
 * alongside ai_cost_usd_period — see app/api/whop/webhook/route.ts). */
export const EXTRA_CREDIT_PRICE_EUR = 9.99;
export const EXTRA_CREDIT_CREDITS = 1500;
export const EXTRA_CREDIT_BUDGET_USD = (EXTRA_CREDIT_CREDITS / CREDITS_PER_EUR) * USD_PER_EUR;

/** Converts a real USD cost (as tracked in ai_cost_usd_period) to the
 * number of credits it represents, for display — the only place this
 * ratio is exposed outside this module, and only ever as a plain credit
 * count, never alongside a euro amount. */
export function usdToCredits(usd: number): number {
  return Math.round((usd / USD_PER_EUR) * CREDITS_PER_EUR);
}

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === "string" && value in TIERS;
}

/** Whether an (possibly absent) tier grants a given feature — false for
 * every feature when there's no active tier at all. Pure/no DB access, so
 * usable from both server and client code. */
export function hasFeatureAccess(tier: SubscriptionTier | null, feature: keyof TierFeatures): boolean {
  if (!tier) return false;
  return TIERS[tier].features[feature];
}

/** Fraction of a fiche's content shown in clear to a non-subscriber (or a
 * subscriber whose access has lapsed) before the progressive blur kicks
 * in — see lib/subscription/preview.ts. */
export const FREE_PREVIEW_FRACTION = 0.1;
