import { NextResponse } from "next/server";
import { getSiteUrl, getWhop, whopEnv } from "@/lib/whop/client";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { logStep } from "@/lib/observability/timing";
import { getDictionary } from "@/lib/i18n/server";

/**
 * One-time (not recurring) Whop Checkout that adds a fixed credit top-up to
 * the current period's cap — see app/api/whop/webhook/route.ts's
 * "ai_credit_topup" branch, which grants the credit once this payment
 * succeeds. Available to an active subscriber on any tier.
 *
 * References a Plan pre-created in the Whop dashboard (WHOP_CREDIT_PLAN_ID)
 * rather than creating one inline: in testing, a checkout built from an
 * inline plan never generated any webhook delivery at all, while
 * referencing an existing plan_id (as the subscription checkout already
 * does) worked immediately — see app/api/whop/checkout/route.ts.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });

  const subscription = await getSubscriptionInfo(user.id);
  if (!subscription.isActive) {
    return NextResponse.json(
      { error: t.errors.subscription.activeRequiredForCreditTopup },
      { status: 402 },
    );
  }

  const planId = whopEnv("WHOP_CREDIT_PLAN_ID");
  if (!planId) return NextResponse.json({ error: t.errors.whop.missingConfig }, { status: 500 });

  const whop = getWhop();
  const siteUrl = getSiteUrl(request);
  const redirectUrl = `${siteUrl}/abonnement?checkout=success`;

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
    return NextResponse.json({ error: t.errors.whop.checkoutCreationFailed }, { status: 500 });
  }

  return NextResponse.json({ url: config.purchase_url });
}
