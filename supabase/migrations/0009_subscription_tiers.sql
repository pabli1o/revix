-- Replaces the single-plan abonnement + one-time credit top-up model with 3
-- fixed-price monthly tiers (see lib/subscription/constants.ts) — every
-- plan is now recurring, there is no more one-time payment at all.
--
-- `tier` records which of the 3 Whop plans a subscriber is on; it's set by
-- the webhook from the checkout's own metadata (see app/api/whop/checkout
-- and app/api/whop/webhook). ai_cost_usd_period alone (checked against that
-- tier's own budget) replaces the old base-budget-plus-topup total, so
-- extra_credit_usd_period and the whole one-time-topup ledger go away.
alter table public.subscriptions
  add column if not exists tier text check (tier in ('tier1', 'tier2', 'tier3')),
  drop column if exists extra_credit_usd_period;

drop function if exists public.increment_ai_credit(uuid, numeric);

drop table if exists public.ai_credit_topups;
