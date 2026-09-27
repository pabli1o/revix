import { NextResponse } from "next/server";
import { unwrapWebhook, WebhookVerificationError } from "@whop/sdk/helpers";
import type { Whop } from "@whop/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import { isSubscriptionTier } from "@/lib/subscription/constants";
import { whopEnv } from "@/lib/whop/client";
import { logStep } from "@/lib/observability/timing";

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

/** membership.activated: (re)links the account's row to this membership,
 * records which of the 3 tiers it's for (from the checkout's own
 * metadata — see app/api/whop/checkout/route.ts), and refreshes
 * status/period end. Deliberately does NOT touch ai_cost_usd_period —
 * Supabase's upsert only updates the columns listed here, so the existing
 * usage counter (0 on a genuinely new row, whatever it already was on a
 * status refresh) is left alone; resetting it on an actual renewal is
 * payment.succeeded's job below, which — unlike Membership — carries a
 * billing_reason. */
async function upsertFromMembership(membership: Whop.Membership, tag: string) {
  const metadata = membership.metadata as Record<string, unknown> | null;
  const userId = metadata?.userId as string | undefined;
  if (!userId) return;

  const tier = isSubscriptionTier(metadata?.tier) ? metadata.tier : null;
  if (!tier) {
    logStep(tag, `membership ${membership.id} has no valid metadata.tier — metadata=${JSON.stringify(metadata)}`);
  }

  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      whop_user_id: membership.user_id,
      whop_membership_id: membership.id,
      status: mapMembershipStatus(membership.status),
      tier,
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

/** Resets the monthly usage budget on a genuine renewal charge
 * (billing_reason "subscription_cycle"), never the first payment on a
 * brand-new membership (already 0 by column default). */
async function resetUsageOnRenewal(userId: string) {
  const admin = createAdminClient();
  await admin.from("subscriptions").update({ ai_cost_usd_period: 0 }).eq("user_id", userId);
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

  // Logged unconditionally — the fastest way to answer "did Whop even send
  // this event" from Vercel's logs alone, instead of guessing from the
  // dashboard.
  const tag = `whop-webhook:${event.id}`;
  logStep(tag, `received ${event.type}`);

  switch (event.type) {
    case "membership.activated": {
      await upsertFromMembership(event.data as Whop.Membership, tag);
      break;
    }

    case "membership.deactivated": {
      await deactivateMembership(event.data as Whop.Membership);
      break;
    }

    case "payment.succeeded": {
      const payment = event.data as Whop.Payment;
      if (payment.billing_reason === "subscription_cycle") {
        const userId = (payment.metadata as Record<string, unknown> | null)?.userId as string | undefined;
        if (userId) {
          await resetUsageOnRenewal(userId);
          logStep(tag, `usage reset for user ${userId} (renewal payment ${payment.id})`);
        } else {
          logStep(tag, `renewal payment ${payment.id} has no metadata.userId — usage not reset`);
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
