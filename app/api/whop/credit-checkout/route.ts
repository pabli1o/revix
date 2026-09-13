import { NextResponse } from "next/server";
import { getSiteUrl, getWhop } from "@/lib/whop/client";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { EXTRA_CREDIT_PRICE_EUR } from "@/lib/subscription/constants";

/**
 * One-time (not recurring) Whop Checkout that unlocks extra usage budget
 * for the rest of the current billing period — see
 * app/api/whop/webhook/route.ts's "ai_credit_topup" branch, which grants
 * the credit once this payment succeeds. Uses an inline `plan` (plan_type
 * "one_time") rather than a Dashboard-configured WHOP_PLAN_ID (like the
 * subscription) since this is the one fixed one-off amount — Whop reuses a
 * matching existing plan instead of creating a duplicate each time unless
 * `force_create_new_plan` is set, so this doesn't spawn a new Plan object
 * on every purchase.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const subscription = await getSubscriptionInfo(user.id);
  if (!subscription.isActive) {
    return NextResponse.json(
      { error: "Un abonnement actif est nécessaire pour acheter un supplément de crédit." },
      { status: 402 },
    );
  }

  const whop = getWhop();
  const siteUrl = getSiteUrl();

  const config = await whop.checkoutConfigurations.create({
    account_id: process.env.WHOP_ACCOUNT_ID,
    plan: {
      plan_type: "one_time",
      title: "Crédits Revix",
      currency: "eur",
      initial_price: EXTRA_CREDIT_PRICE_EUR,
    },
    redirect_url: `${siteUrl}/abonnement`,
    metadata: { userId: user.id, type: "ai_credit_topup" },
  });

  if (!config.purchase_url) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: config.purchase_url });
}
