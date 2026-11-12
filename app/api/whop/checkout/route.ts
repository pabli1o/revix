import { NextResponse } from "next/server";
import { getSiteUrl, getWhop, whopEnv } from "@/lib/whop/client";
import { createClient } from "@/lib/supabase/server";
import { isSubscriptionTier, TIER_ORDER } from "@/lib/subscription/constants";
import { logStep } from "@/lib/observability/timing";
import { getDictionary } from "@/lib/i18n/server";

// tier3 is deliberately left in this map (rather than deleted) even though
// it's unreachable below — it documents that the retired 39,99 € plan used
// to live at WHOP_PLAN_ID_TIER3, for whoever next touches this file.
const PLAN_ENV_BY_TIER = {
  tier0: "WHOP_PLAN_ID_TIER0",
  tier1: "WHOP_PLAN_ID_TIER1",
  tier2: "WHOP_PLAN_ID_TIER2",
  tier3: "WHOP_PLAN_ID_TIER3",
} as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { tier?: string; draftId?: string } | null;
  const tier = body?.tier;
  // isSubscriptionTier alone would still accept "tier3" — TIERS keeps it
  // configured so an existing subscriber's access check still works (see
  // lib/subscription/constants.ts), but it's retired and must never be
  // purchasable again, especially now that its old Whop plan_id has been
  // repriced and reassigned to tier0 (plan_F5UaVA2vxvHGZ: 39,99€ → 4,99€).
  // Checking TIER_ORDER (what's actually offered) instead of `tier in
  // TIERS` structurally closes this off at the code level, regardless of
  // whether WHOP_PLAN_ID_TIER3 is still set in the environment.
  if (!isSubscriptionTier(tier) || !TIER_ORDER.includes(tier)) {
    return NextResponse.json({ error: t.errors.whop.invalidOffer }, { status: 400 });
  }
  const draftId = body?.draftId;

  const planId = whopEnv(PLAN_ENV_BY_TIER[tier]);
  if (!planId) return NextResponse.json({ error: t.errors.whop.missingConfig }, { status: 500 });

  const whop = getWhop();
  const siteUrl = getSiteUrl(request);

  // Whop's checkout configurations take a single redirect_url — no
  // separate success/cancel URLs like Stripe Checkout Sessions. Reaching
  // this URL at all already implies a completed checkout (an abandoned one
  // never redirects back), so "?checkout=success" is safe to set
  // unconditionally here. components/fiches/new/assign-flow.tsx still
  // doesn't trust it blindly either way: it polls /api/me for the
  // subscription to actually turn active (the webhook can land a moment
  // after the redirect) and falls back to a timeout state if it never does.
  const redirectUrl = draftId
    ? `${siteUrl}/fiches/new/assign?draft=${draftId}&checkout=success`
    : `${siteUrl}/abonnement?checkout=success`;

  // Logged unconditionally — confirms siteUrl was derived from this exact
  // request's own Host header (see getSiteUrl) rather than a possibly
  // mismatched NEXT_PUBLIC_SITE_URL/VERCEL_PROJECT_PRODUCTION_URL, the root
  // cause of a past "redirected to /login instead of back to my page" bug.
  logStep(`whop-checkout:${user.id}`, `siteUrl=${siteUrl} redirect_url=${redirectUrl}`);

  const config = await whop.checkoutConfigurations.create({
    account_id: whopEnv("WHOP_ACCOUNT_ID"),
    plan_id: planId,
    redirect_url: redirectUrl,
    // Copied by Whop onto both the resulting payment and membership (see
    // app/api/whop/webhook/route.ts) — this is how a webhook event links
    // back to our own user and tier, since Whop has no client_reference_id
    // concept and a Plan id alone doesn't tell the webhook which of our
    // tiers it maps to (that mapping only exists in PLAN_ENV_BY_TIER above).
    metadata: { userId: user.id, type: "subscription", tier, ...(draftId ? { draftId } : {}) },
  });

  if (!config.purchase_url) {
    return NextResponse.json({ error: t.errors.whop.checkoutCreationFailed }, { status: 500 });
  }

  return NextResponse.json({ url: config.purchase_url });
}
