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
   * count on the pricing cards, counting a fiche + its 3 automatic quiz
   * as one unit. Indicative only — real cost per fiche varies a lot with
   * source type (photo vs. PDF) and length — never update this without
   * re-deriving it from lib/anthropic/client.ts's live pricing/effort/cache
   * constants, since it isn't computed from them automatically. */
  estimatedFiches: { min: number; max: number };
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  tier1: {
    label: "Fiches",
    priceEur: 9.99,
    credits: 1500,
    budgetUsd: (1500 / CREDITS_PER_EUR) * USD_PER_EUR,
    features: { quiz: false, planning: false },
    estimatedFiches: { min: 5, max: 8 },
  },
  tier2: {
    label: "Complet",
    priceEur: 19.99,
    credits: 4000,
    budgetUsd: (4000 / CREDITS_PER_EUR) * USD_PER_EUR,
    features: { quiz: true, planning: true },
    estimatedFiches: { min: 15, max: 20 },
  },
  tier3: {
    label: "Complet+",
    priceEur: 39.99,
    credits: 9000,
    budgetUsd: (9000 / CREDITS_PER_EUR) * USD_PER_EUR,
    features: { quiz: true, planning: true },
    estimatedFiches: { min: 35, max: 45 },
  },
};

export const TIER_ORDER: SubscriptionTier[] = ["tier1", "tier2", "tier3"];

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
