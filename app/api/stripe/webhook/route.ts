import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import { EXTRA_CREDIT_BUDGET_USD } from "@/lib/subscription/constants";

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
    .select("period_start, ai_cost_usd_period, extra_credit_usd_period")
    .eq("user_id", userId)
    .maybeSingle();

  // A new billing period started: reset the monthly AI usage budget and any
  // extra credit purchased last period (it never rolls over).
  const isNewPeriod = !existingRow?.period_start || existingRow.period_start !== periodStart;

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: mapStatus(subscription.status),
      current_period_end: periodEnd,
      period_start: periodStart,
      ai_cost_usd_period: isNewPeriod ? 0 : (existingRow?.ai_cost_usd_period ?? 0),
      extra_credit_usd_period: isNewPeriod ? 0 : (existingRow?.extra_credit_usd_period ?? 0),
    },
    { onConflict: "user_id" },
  );
}

/**
 * Grants the one-time AI credit top-up for a completed one-off Checkout
 * Session (mode: "payment", not a subscription). Idempotent against
 * Stripe's at-least-once webhook delivery: the insert into
 * ai_credit_topups has session.id as its primary key, so a redelivered
 * event for the same session fails the insert and the credit is skipped
 * rather than granted twice.
 */
async function grantAiCredit(session: Stripe.Checkout.Session, userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_credit_topups")
    .insert({ session_id: session.id, user_id: userId, amount_usd: EXTRA_CREDIT_BUDGET_USD });
  if (error) {
    // 23505 = unique_violation on session_id: already recorded (duplicate
    // webhook delivery) — no-op. Any other error is a real failure; throw
    // so the route returns non-200 and Stripe retries the webhook rather
    // than silently losing the credit the user just paid for.
    if (error.code === "23505") return;
    throw new Error(error.message);
  }

  await admin.rpc("increment_ai_credit", { p_user_id: userId, p_amount: EXTRA_CREDIT_BUDGET_USD });
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
      if (userId && session.mode === "payment" && session.metadata?.type === "ai_credit_topup") {
        await grantAiCredit(session, userId);
      } else if (userId && session.subscription) {
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
