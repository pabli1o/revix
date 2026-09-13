import { NextResponse } from "next/server";
import { getWhop } from "@/lib/whop/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Whop has no Stripe-Billing-Portal equivalent (no hosted self-service page
 * we can redirect to) — so unlike the old /api/stripe/portal, this cancels
 * the membership directly via the API instead of returning a URL.
 * cancel_at_period_end: true keeps access until the current period ends,
 * matching what canceling through a Stripe portal did.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("whop_membership_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub?.whop_membership_id) {
    return NextResponse.json({ error: "Aucun abonnement à gérer" }, { status: 400 });
  }

  const whop = getWhop();
  await whop.memberships.cancel({ id: sub.whop_membership_id, cancel_at_period_end: true });

  return NextResponse.json({ ok: true });
}
