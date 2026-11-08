import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import { TIERS, hasFeatureAccess, type SubscriptionTier, type TierFeatures } from "./constants";
import { logStep } from "@/lib/observability/timing";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  tier: SubscriptionTier | null;
  aiCostUsdPeriod: number;
  extraCreditUsdPeriod: number;
}

export async function getSubscriptionInfo(userId: string | null | undefined): Promise<SubscriptionInfo> {
  if (!userId) {
    return { status: "inactive", isActive: false, tier: null, aiCostUsdPeriod: 0, extraCreditUsdPeriod: 0 };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status, tier, ai_cost_usd_period, extra_credit_usd_period")
    .eq("user_id", userId)
    .maybeSingle();

  const status = data?.status ?? "inactive";
  const isActive = status === "active";
  return {
    status,
    isActive,
    tier: isActive ? ((data?.tier as SubscriptionTier | null) ?? null) : null,
    aiCostUsdPeriod: data?.ai_cost_usd_period ?? 0,
    extraCreditUsdPeriod: data?.extra_credit_usd_period ?? 0,
  };
}

/** Convenience wrapper around the pure hasFeatureAccess so call sites that
 * already have a SubscriptionInfo don't need to import both modules. */
export function subscriptionHasFeature(subscription: SubscriptionInfo, feature: keyof TierFeatures): boolean {
  return hasFeatureAccess(subscription.tier, feature);
}

export class AiUsageCapExceededError extends Error {
  constructor() {
    // Kept generic (no "IA" wording, no precise euro amounts) even though
    // this message currently isn't rendered as-is anywhere: the fiche/quiz
    // generation routes surface it only via the aiUsageCapExceeded flag,
    // and the client redirects to a dedicated /limite screen instead of
    // displaying this text — see that page for the exact user-facing
    // wording rules.
    super("Plafond de crédits mensuels atteint.");
    this.name = "AiUsageCapExceededError";
  }
}

/**
 * Called once right before every Claude generation call (fiche or quiz —
 * see lib/anthropic/client.ts), for both cost sources combined. No-ops for
 * anyone without an active subscription: the cap only ever applied to
 * subscribers, and generation stays free/unlimited for everyone else
 * exactly as before.
 */
export async function assertAiUsageBudgetAvailable(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status, tier, ai_cost_usd_period, extra_credit_usd_period")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || data.status !== "active" || !data.tier) return;

  const budget = TIERS[data.tier as SubscriptionTier].budgetUsd + (data.extra_credit_usd_period ?? 0);
  if (data.ai_cost_usd_period >= budget) {
    throw new AiUsageCapExceededError();
  }
}

/**
 * Records the real cost of one Claude API call against the user's monthly
 * total, via an atomic SQL increment (see migration 0007) — needed because
 * this can race with a renewal reset happening concurrently via the Whop
 * webhook, a separate process from the app's own AI-lock-serialized
 * generation calls.
 *
 * No-ops for a $0 cost (never happens in practice, but avoids a pointless
 * write) and silently no-ops if the user has no subscriptions row (never
 * happens here since this is only called after assertAiUsageBudgetAvailable
 * already read one, but defensive against a row being deleted mid-request).
 */
export async function recordAiUsageCost(userId: string, costUsd: number): Promise<void> {
  if (costUsd <= 0) return;
  const admin = createAdminClient();
  await admin.rpc("increment_ai_usage_cost", { p_user_id: userId, p_amount: costUsd });
}

export class FreeFicheTrialExhaustedError extends Error {
  constructor() {
    // Generic wording, no "IA" — surfaced via the freeTrialExhausted flag
    // on the fiche generation response, never rendered as-is (see
    // creation-flow.tsx for the actual user-facing message/CTA).
    super("Fiche d'essai déjà utilisée.");
    this.name = "FreeFicheTrialExhaustedError";
  }
}

/**
 * An account with no active subscription gets exactly one successful
 * fiche generation, ever — checked at the top of
 * app/api/fiches/generate/route.ts, before any Claude call. No-ops for an
 * active subscriber: they're governed by assertAiUsageBudgetAvailable
 * instead, unaffected by this cap.
 *
 * Deliberately checked per HTTP request to the generate route rather than
 * per "Générer la fiche" click: a single click can fan out into several
 * parallel requests (a dense PDF split into page-range chunks — see
 * creation-flow.tsx/pdf-split.ts), all starting before any of them has
 * had a chance to mark the trial used, so they all correctly pass this
 * check together — one click's result is "one fiche" even when it's
 * built from several chunks. A genuinely separate, later click sees the
 * flag already set by the first one's chunks and is correctly blocked.
 */
export async function assertFreeFicheTrialAvailable(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("free_fiche_generated")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Logged loudly rather than silently ignored — the most likely real
    // cause is migration 0014 (profiles.free_fiche_generated) not having
    // been applied yet to this Supabase project (undefined_column, code
    // 42703), which would otherwise look like "the free-trial cap just
    // never does anything" with no clue why. Fails OPEN (treats as trial
    // available) rather than blocking every non-subscriber from
    // generating anything the moment this column is missing — that
    // regression would be far worse than the cap silently not applying.
    logStep(
      `free-trial:${userId.slice(0, 8)}`,
      `assertFreeFicheTrialAvailable: profiles query FAILED (code ${error.code ?? "?"}) — ${error.message}. Failing open (treating trial as available) — check that migration 0014 was applied.`,
    );
    return;
  }

  if (!data) {
    // handle_new_user (migration 0001) creates this row at signup, so
    // this should never actually happen — logged in case it ever does
    // (a row deleted out of band, or a signup path that bypassed the
    // trigger) rather than failing silently either way.
    logStep(
      `free-trial:${userId.slice(0, 8)}`,
      "assertFreeFicheTrialAvailable: no profiles row found for this user — treating trial as available.",
    );
    return;
  }

  if (data.free_fiche_generated) {
    throw new FreeFicheTrialExhaustedError();
  }
}

/** Marks the free trial as used after a successful generation. A plain
 * update (not an atomic RPC like the usage-cost increment above) is
 * enough: it's a one-way false→true flip, so two concurrent chunk
 * requests from the same click both writing `true` is harmless — there's
 * nothing to lose by not serializing it. */
export async function markFreeFicheGenerated(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ free_fiche_generated: true }).eq("id", userId);
  if (error) {
    logStep(
      `free-trial:${userId.slice(0, 8)}`,
      `markFreeFicheGenerated: update FAILED (code ${error.code ?? "?"}) — ${error.message}`,
    );
  }
}
