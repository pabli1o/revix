-- Adds the new 4,99 €/mois "Fiches" entry tier (tier0: 500 credits, no
-- quiz/planning/examen — see lib/subscription/constants.ts) below the
-- existing tier1, which now becomes the full-access plan at 9,99 € instead
-- of staying fiches-only. tier1/tier2/tier3 rows are left completely
-- untouched by this migration: an existing tier1 subscriber keeps their
-- row exactly as it is and automatically gains quiz/planning/examen
-- access purely from the updated TIERS config in the app, no data
-- migration needed for them.
--
-- The CHECK constraint from 0009_subscription_tiers.sql only allowed
-- ('tier1','tier2','tier3') — dropped and recreated here to also allow
-- 'tier0'. Looked up by introspection rather than a hardcoded name, since
-- an inline `add column ... check (...)` lets Postgres auto-name the
-- constraint and that name was never recorded anywhere in this codebase.
do $$
declare
  existing_constraint text;
begin
  select conname into existing_constraint
  from pg_constraint
  where conrelid = 'public.subscriptions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%tier%';

  if existing_constraint is not null then
    execute format('alter table public.subscriptions drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.subscriptions
  add constraint subscriptions_tier_check check (tier in ('tier0', 'tier1', 'tier2', 'tier3'));
