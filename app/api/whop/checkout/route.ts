import { NextResponse } from "next/server";
import { getSiteUrl, getWhop } from "@/lib/whop/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const planId = process.env.WHOP_PLAN_ID;
  if (!planId) return NextResponse.json({ error: "Configuration Whop manquante" }, { status: 500 });

  const body = (await request.json().catch(() => null)) as { draftId?: string } | null;
  const draftId = body?.draftId;

  const whop = getWhop();
  const siteUrl = getSiteUrl();

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

  const config = await whop.checkoutConfigurations.create({
    account_id: process.env.WHOP_ACCOUNT_ID,
    plan_id: planId,
    redirect_url: redirectUrl,
    // Copied by Whop onto both the resulting payment and membership (see
    // app/api/whop/webhook/route.ts) — this is how a webhook event links
    // back to our own user, since Whop has no client_reference_id concept.
    metadata: { userId: user.id, type: "subscription", ...(draftId ? { draftId } : {}) },
  });

  if (!config.purchase_url) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: config.purchase_url });
}
