import { NextResponse } from "next/server";
import { getSiteUrl, getWhop, whopEnv } from "@/lib/whop/client";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { logStep } from "@/lib/observability/timing";

/**
 * One-time (not recurring) Whop Checkout that unlocks extra usage budget
 * for the rest of the current billing period — see
 * app/api/whop/webhook/route.ts's "ai_credit_topup" branch, which grants
 * the credit once this payment succeeds.
 *
 * References a Plan pre-created in the Whop dashboard (WHOP_CREDIT_PLAN_ID)
 * rather than creating one inline (plan: {...}, plan_type "one_time") the
 * way this route originally did: in testing, a checkout built from an
 * inline plan never generated ANY webhook delivery at all (confirmed empty
 * in Whop's own "Recent deliveries"), while the subscription checkout
 * below — which references an existing plan_id — worked immediately. The
 * inline plan object has its own nested account_id (separate from the
 * checkout configuration's own account_id, and never set here), which is
 * the most likely explanation, but rather than guess at which inline-plan
 * field Whop needs, this switches to the exact mechanism already proven to
 * work end-to-end.
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

  const planId = whopEnv("WHOP_CREDIT_PLAN_ID");
  if (!planId) return NextResponse.json({ error: "Configuration Whop manquante" }, { status: 500 });

  const whop = getWhop();
  const siteUrl = getSiteUrl();
  const redirectUrl = `${siteUrl}/abonnement`;

  const config = await whop.checkoutConfigurations.create({
    account_id: whopEnv("WHOP_ACCOUNT_ID"),
    plan_id: planId,
    redirect_url: redirectUrl,
    metadata: { userId: user.id, type: "ai_credit_topup" },
  });

  // Logged unconditionally so a reported redirect issue after payment can
  // be checked against the exact URLs actually sent to Whop, instead of
  // assuming getSiteUrl() resolved the way this environment intends it to.
  logStep(
    `whop-credit-checkout:${user.id}`,
    `siteUrl=${siteUrl} redirect_url=${redirectUrl} purchase_url=${config.purchase_url}`,
  );

  if (!config.purchase_url) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: config.purchase_url });
}
