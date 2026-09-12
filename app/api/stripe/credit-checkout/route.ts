import { NextResponse } from "next/server";
import { getSiteUrl, getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { EXTRA_CREDIT_PRICE_EUR } from "@/lib/subscription/constants";

/**
 * One-time (not recurring) Stripe Checkout payment that unlocks extra AI
 * usage budget for the rest of the current billing period — see
 * app/api/stripe/webhook/route.ts's "ai_credit_topup" branch, which grants
 * the credit once this payment completes. Uses inline `price_data` rather
 * than a Dashboard-configured price ID (like STRIPE_PRICE_ID for the
 * subscription) since this is the one fixed one-off amount.
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

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(EXTRA_CREDIT_PRICE_EUR * 100),
          product_data: {
            name: "Crédits Revix",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/abonnement?credit=success`,
    cancel_url: `${siteUrl}/abonnement?credit=cancel`,
    client_reference_id: user.id,
    customer: existingSub?.stripe_customer_id ?? undefined,
    customer_email: existingSub?.stripe_customer_id ? undefined : (user.email ?? undefined),
    metadata: { userId: user.id, type: "ai_credit_topup" },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
