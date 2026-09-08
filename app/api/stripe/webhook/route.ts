import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

async function upsertFromSubscription(subscription: Stripe.Subscription, userIdHint?: string) {
  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  let userId: string | undefined = userIdHint ?? subscription.metadata?.userId;
  if (!userId) {
    const { data: existing } = await admin
      .from("subscriptions")
      .select("user_id, period_start")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (!existing?.user_id) return; // Nothing we can link this to.
    userId = existing.user_id;
  }

  const item = subscription.items.data[0];
  const periodStart = item ? new Date(item.current_period_start * 1000).toISOString() : null;
  const periodEnd = item ? new Date(item.current_period_end * 1000).toISOString() : null;

  const { data: existingRow } = await admin
    .from("subscriptions")
    .select("period_start, fiches_generated_period")
    .eq("user_id", userId)
    .maybeSingle();

  // A new billing period started: reset the monthly fiche-generation cap.
  const isNewPeriod = !existingRow?.period_start || existingRow.period_start !== periodStart;

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: mapStatus(subscription.status),
      current_period_end: periodEnd,
      period_start: periodStart,
      fiches_generated_period: isNewPeriod ? 0 : (existingRow?.fiches_generated_period ?? 0),
    },
    { onConflict: "user_id" },
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id ?? session.metadata?.userId ?? undefined;
      if (userId && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertFromSubscription(subscription, userId);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await upsertFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
