import { NextResponse } from "next/server";
import { getSiteUrl, getWhop, whopEnv } from "@/lib/whop/client";
import { createClient } from "@/lib/supabase/server";
import { isSubscriptionTier } from "@/lib/subscription/constants";
import { logStep } from "@/lib/observability/timing";

const PLAN_ENV_BY_TIER = {
  tier1: "WHOP_PLAN_ID_TIER1",
  tier2: "WHOP_PLAN_ID_TIER2",
  tier3: "WHOP_PLAN_ID_TIER3",
} as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { tier?: string; draftId?: string } | null;
  const tier = body?.tier;
  if (!isSubscriptionTier(tier)) {
    return NextResponse.json({ error: "Offre invalide" }, { status: 400 });
  }
  const draftId = body?.draftId;

  const planId = whopEnv(PLAN_ENV_BY_TIER[tier]);
  if (!planId) return NextResponse.json({ error: "Configuration Whop manquante" }, { status: 500 });

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
    // concept and a Plan id alone doesn't tell the webhook which of our 3
    // tiers it maps to (that mapping only exists in PLAN_ENV_BY_TIER above).
    metadata: { userId: user.id, type: "subscription", tier, ...(draftId ? { draftId } : {}) },
  });

  if (!config.purchase_url) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: config.purchase_url });
}
