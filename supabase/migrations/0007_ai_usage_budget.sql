-- Replaces the old MONTHLY_FICHE_CAP (20 fiches *saved*/month) with a
-- cost-based cap: active subscribers get a 3,50 € budget of real Claude API
-- cost (fiche + quiz generation combined, computed from response.usage) per
-- billing period, with an optional one-time top-up (+4,99 €) purchasable
-- via a one-time Stripe Checkout payment. See lib/subscription/gate.ts and
-- lib/anthropic/client.ts.

alter table public.subscriptions
  drop column if exists fiches_generated_period,
  add column if not exists ai_cost_usd_period numeric(10, 6) not null default 0,
  add column if not exists extra_credit_usd_period numeric(10, 6) not null default 0;

-- Atomic increments. Needed because increments happen from two different
-- call sites that are NOT mutually serialized: the app's own generation
-- path (already serialized per-process by the AI lock, but that's not a
-- database-level guarantee) and the Stripe webhook (a separate request
-- entirely). A plain read-then-write from application code would risk a
-- lost update; doing the increment as one UPDATE statement doesn't.
--
-- SECURITY: these move real money (usage budget / purchased credit), so —
-- unlike try_acquire_ai_lock/release_ai_lock in 0002_ai_lock.sql, which
-- default to PUBLIC execute because their worst case is a stuck lock —
-- these two REVOKE the default PUBLIC execute grant. Only service_role
-- (used exclusively by the server's admin client) may call them; otherwise
-- any authenticated user could pass an arbitrary p_user_id/p_amount over
-- the RPC endpoint and grant themselves free budget or tamper with another
-- user's usage.
create or replace function public.increment_ai_usage_cost(p_user_id uuid, p_amount numeric)
returns void
language sql
security definer
set search_path = public
as $$
  update public.subscriptions
  set ai_cost_usd_period = ai_cost_usd_period + p_amount
  where user_id = p_user_id;
$$;

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

revoke execute on function public.increment_ai_usage_cost(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.increment_ai_credit(uuid, numeric) from public, anon, authenticated;

-- One row per successfully processed one-time "AI credit" Stripe Checkout
-- Session. The primary key makes granting credit idempotent against
-- Stripe's at-least-once webhook delivery: a redelivered event for a
-- session already recorded here fails the insert, so the webhook skips
-- re-granting credit for it (see app/api/stripe/webhook/route.ts).
create table if not exists public.ai_credit_topups (
  session_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_usd numeric(10, 6) not null,
  created_at timestamptz not null default now()
);

alter table public.ai_credit_topups enable row level security;

-- Same pattern as subscriptions: owners can read their own top-ups; all
-- writes happen through the service_role key (the Stripe webhook).
create policy "ai_credit_topups_select_own" on public.ai_credit_topups
  for select using (auth.uid() = user_id);
