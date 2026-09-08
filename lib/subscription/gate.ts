import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import { MONTHLY_FICHE_CAP } from "./constants";

export { MONTHLY_FICHE_CAP, FREE_PREVIEW_SENTENCES } from "./constants";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  fichesGeneratedPeriod: number;
  monthlyCap: number;
}

export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status, fiches_generated_period")
    .eq("user_id", userId)
    .maybeSingle();

  const status = data?.status ?? "inactive";
  return {
    status,
    isActive: status === "active",
    fichesGeneratedPeriod: data?.fiches_generated_period ?? 0,
    monthlyCap: MONTHLY_FICHE_CAP,
  };
}

export class FicheQuotaExceededError extends Error {
  constructor() {
    super(
      `Limite de ${MONTHLY_FICHE_CAP} fiches enregistrées ce mois-ci atteinte. Réessayez le mois prochain.`,
    );
    this.name = "FicheQuotaExceededError";
  }
}

/**
 * Called once per fiche at SAVE time (never at generation time). Free
 * users are blocked from saving well before this by the subscription gate
 * on the API route itself, so in practice this only ever runs for active
 * subscribers — but it defensively no-ops for anyone else, since the cap
 * is defined to apply only to subscribers.
 *
 * Not fully atomic (read-then-write): acceptable here because a single
 * user cannot realistically save two fiches within the same millisecond,
 * and a rare race would at worst let one fiche through past the cap.
 */
export async function checkAndIncrementFicheQuota(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status, fiches_generated_period")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || data.status !== "active") {
    // Cap only applies to active subscribers.
    return;
  }

  if (data.fiches_generated_period >= MONTHLY_FICHE_CAP) {
    throw new FicheQuotaExceededError();
  }

  await admin
    .from("subscriptions")
    .update({ fiches_generated_period: data.fiches_generated_period + 1 })
    .eq("user_id", userId);
}
