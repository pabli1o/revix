import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import { EXTRA_CREDIT_BUDGET_EUR, EXTRA_CREDIT_PRICE_EUR, MONTHLY_AI_BUDGET_EUR, MONTHLY_AI_BUDGET_USD } from "./constants";

export { FREE_PREVIEW_SENTENCES, MONTHLY_AI_BUDGET_EUR, EXTRA_CREDIT_PRICE_EUR, EXTRA_CREDIT_BUDGET_EUR } from "./constants";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  aiCostUsdPeriod: number;
  extraCreditUsdPeriod: number;
}

export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status, ai_cost_usd_period, extra_credit_usd_period")
    .eq("user_id", userId)
    .maybeSingle();

  const status = data?.status ?? "inactive";
  return {
    status,
    isActive: status === "active",
    aiCostUsdPeriod: data?.ai_cost_usd_period ?? 0,
    extraCreditUsdPeriod: data?.extra_credit_usd_period ?? 0,
  };
}

export class AiUsageCapExceededError extends Error {
  constructor() {
    super(
      `Tu as atteint le plafond de ${MONTHLY_AI_BUDGET_EUR.toFixed(2)} € d'utilisation IA ce mois-ci. Débloque ${EXTRA_CREDIT_BUDGET_EUR.toFixed(2)} € supplémentaires pour ${EXTRA_CREDIT_PRICE_EUR.toFixed(2)} € afin de continuer à générer des fiches et des quiz jusqu'à la fin du mois.`,
    );
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
    .select("status, ai_cost_usd_period, extra_credit_usd_period")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || data.status !== "active") return;

  const budget = MONTHLY_AI_BUDGET_USD + data.extra_credit_usd_period;
  if (data.ai_cost_usd_period >= budget) {
    throw new AiUsageCapExceededError();
  }
}

/**
 * Records the real cost of one Claude API call against the user's monthly
 * total, via an atomic SQL increment (see migration 0007) — needed because
 * this can race with the Stripe webhook granting a credit top-up
 * concurrently, which is a separate process from the app's own
 * AI-lock-serialized generation calls.
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
