import { NextResponse } from "next/server";
import { getSiteUrl, getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/abonnement?checkout=success`,
    cancel_url: `${siteUrl}/abonnement?checkout=cancel`,
    client_reference_id: user.id,
    customer: existingSub?.stripe_customer_id ?? undefined,
    customer_email: existingSub?.stripe_customer_id ? undefined : (user.email ?? undefined),
    subscription_data: { metadata: { userId: user.id } },
    metadata: { userId: user.id },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
