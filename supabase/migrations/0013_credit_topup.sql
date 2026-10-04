-- Re-introduces a one-time (non-recurring) credit top-up on top of the 3
-- monthly subscription tiers (see 0009_subscription_tiers.sql, which
-- removed this when the single-plan model was replaced by 3 tiers — the
-- mechanism it dropped is restored here unchanged, since every subscriber
-- on any tier can now buy it again from /abonnement). See
-- lib/subscription/gate.ts and app/api/whop/webhook/route.ts.

alter table public.subscriptions
  add column if not exists extra_credit_usd_period numeric(10, 6) not null default 0;

-- Atomic increment — same rationale as increment_ai_usage_cost in
-- 0007_ai_usage_budget.sql: the Whop webhook runs as a separate request
-- from the app's own generation path, so a plain read-then-write would
-- risk a lost update. SECURITY: moves real purchased credit, so only
-- service_role (the server's admin client) may call it.
create or replace function public.increment_ai_credit(p_user_id uuid, p_amount numeric)
returns void
language sql
security definer
set search_path = public
as $$
  update public.subscriptions
  set extra_credit_usd_period = extra_credit_usd_period + p_amount
  where user_id = p_user_id;
$$;

revoke execute on function public.increment_ai_credit(uuid, numeric) from public, anon, authenticated;

-- One row per successfully processed one-time credit top-up purchase. The
-- primary key makes granting credit idempotent against Whop's at-least-once
-- webhook delivery: a redelivered event for a purchase already recorded
-- here fails the insert, so the webhook skips re-granting credit for it.
create table if not exists public.ai_credit_topups (
  payment_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_usd numeric(10, 6) not null,
  created_at timestamptz not null default now()
);

alter table public.ai_credit_topups enable row level security;

create policy "ai_credit_topups_select_own" on public.ai_credit_topups
  for select using (auth.uid() = user_id);
