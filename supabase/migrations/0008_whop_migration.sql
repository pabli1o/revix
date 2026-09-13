-- Replaces Stripe with Whop as the payment provider (subscription + one-time
-- credit top-up). See app/api/whop/*, lib/whop/client.ts.
--
-- Whop's identifiers replace Stripe's: `whop_user_id` (the buyer's own Whop
-- account, prefixed user_) and `whop_membership_id` (the recurring access
-- grant, prefixed mem_ — Whop's equivalent of a Stripe Subscription).
--
-- `period_start` is dropped outright rather than renamed: Whop's Membership
-- object exposes no period-start field, so the old "did period_start change"
-- reset-detection can't carry over. The new webhook instead resets the
-- monthly usage counters on a Payment event whose `billing_reason` is
-- `subscription_cycle` (an actual renewal charge) — see
-- app/api/whop/webhook/route.ts. `current_period_end` stays: Whop's
-- Membership does expose that one.
alter table public.subscriptions
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  drop column if exists period_start,
  add column if not exists whop_user_id text,
  add column if not exists whop_membership_id text;

-- Idempotency key for the credit top-up webhook switches from a Stripe
-- Checkout Session id to a Whop Payment id (prefixed pay_) — same purpose
-- (a redelivered webhook for the same payment is a no-op insert), just a
-- different provider's id shape.
alter table public.ai_credit_topups rename column session_id to payment_id;
