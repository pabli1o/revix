import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import { TIERS, hasFeatureAccess, type SubscriptionTier, type TierFeatures } from "./constants";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  tier: SubscriptionTier | null;
  aiCostUsdPeriod: number;
  extraCreditUsdPeriod: number;
}

export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
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
