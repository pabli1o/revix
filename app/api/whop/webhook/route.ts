import { NextResponse } from "next/server";
import { unwrapWebhook, WebhookVerificationError } from "@whop/sdk/helpers";
import type { Whop } from "@whop/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import { EXTRA_CREDIT_BUDGET_USD } from "@/lib/subscription/constants";
import { whopEnv } from "@/lib/whop/client";

/** Fern (Whop's SDK generator) emits no discriminated union of webhook
 * payloads — unwrapWebhook returns the raw parsed body untyped (see its
 * own doc comment in @whop/sdk/helpers). This is the shape every Whop
 * webhook delivery shares; `data` is narrowed per `type` below using the
 * specific payload types Whop.PostMembershipActivatedPayload etc. do
 * export (each just `{ ...envelope fields, data: Whop.Membership |
 * Whop.Payment, type: "<literal>" }`). */
interface WhopWebhookEnvelope {
  id: string;
  type: string;
  timestamp: string;
  data: unknown;
}

function mapMembershipStatus(status: Whop.MembershipStatus): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "completed":
    case "canceling":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "expired":
      return "canceled";
    default:
      return "inactive";
  }
}

/** membership.activated: (re)links the account's row to this membership
 * and refreshes status/period end. Deliberately does NOT touch
 * ai_cost_usd_period/extra_credit_usd_period — Supabase's upsert only
 * updates the columns listed here, so the existing usage counters (0 on a
 * genuinely new row, whatever they already were on a status refresh) are
 * left alone; resetting them on an actual renewal is payment.succeeded's
 * job below, which — unlike Membership — carries a billing_reason. */
async function upsertFromMembership(membership: Whop.Membership) {
  const userId = membership.metadata?.userId as string | undefined;
  if (!userId) return;

  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      whop_user_id: membership.user_id,
      whop_membership_id: membership.id,
      status: mapMembershipStatus(membership.status),
      current_period_end: membership.current_period_end,
    },
    { onConflict: "user_id" },
  );
}

/** membership.deactivated: matched by whop_membership_id rather than
 * metadata.userId — mirrors matching the old Stripe webhook did by
 * stripe_customer_id, so this still works even if metadata were ever
 * absent on a later event for the same membership. */
async function deactivateMembership(membership: Whop.Membership) {
  const admin = createAdminClient();
  await admin.from("subscriptions").update({ status: "canceled" }).eq("whop_membership_id", membership.id);
}

/** Grants the one-time credit top-up for a completed "ai_credit_topup"
 * payment. Idempotent against Whop's at-least-once webhook delivery: the
 * insert into ai_credit_topups has payment.id as its primary key, so a
 * redelivered event for the same payment fails the insert and the credit
 * is skipped rather than granted twice. */
async function grantAiCredit(payment: Whop.Payment, userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_credit_topups")
    .insert({ payment_id: payment.id, user_id: userId, amount_usd: EXTRA_CREDIT_BUDGET_USD });
  if (error) {
    // 23505 = unique_violation on payment_id: already recorded (duplicate
    // webhook delivery) — no-op. Any other error is a real failure; throw
    // so the route returns non-200 and Whop retries the webhook rather
    // than silently losing the credit the user just paid for.
    if (error.code === "23505") return;
    throw new Error(error.message);
  }

  await admin.rpc("increment_ai_credit", { p_user_id: userId, p_amount: EXTRA_CREDIT_BUDGET_USD });
}

/** Resets the monthly usage budget and any extra credit purchased last
 * period (it never rolls over) — called only for a genuine renewal charge
 * (billing_reason "subscription_cycle"), never the first payment on a
 * brand-new membership (already 0 by column default) and never a credit
 * top-up (a separate, non-recurring plan). */
async function resetUsageOnRenewal(userId: string) {
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({ ai_cost_usd_period: 0, extra_credit_usd_period: 0 })
    .eq("user_id", userId);
}

export async function POST(request: Request) {
  // Verifies against whichever secret matches the current WHOP_SANDBOX
  // toggle — a sandbox-signed event fails verification while
  // WHOP_SANDBOX=false, and a production one fails while it's true. That's
  // intentional: sandbox and production are tested serially (flip the
  // flag, don't run both at once), matching how getWhop()/whopEnv() switch
  // every other credential the same way — see lib/whop/client.ts.
  const secret = whopEnv("WHOP_WEBHOOK_SECRET");
  const headers = Object.fromEntries(request.headers.entries());
  const body = await request.text();

  let event: WhopWebhookEnvelope;
  try {
    event = unwrapWebhook<WhopWebhookEnvelope>(body, { headers, key: secret });
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
    }
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  switch (event.type) {
    case "membership.activated": {
      await upsertFromMembership(event.data as Whop.Membership);
      break;
    }

    case "membership.deactivated": {
      await deactivateMembership(event.data as Whop.Membership);
      break;
    }

    case "payment.succeeded": {
      const payment = event.data as Whop.Payment;
      const userId = payment.metadata?.userId as string | undefined;
      if (!userId) break;

      if (payment.metadata?.type === "ai_credit_topup") {
        await grantAiCredit(payment, userId);
      } else if (payment.billing_reason === "subscription_cycle") {
        await resetUsageOnRenewal(userId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
