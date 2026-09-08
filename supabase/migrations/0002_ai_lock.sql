-- Global application lock used to serialize every Anthropic API call made by
-- the app (fiche generation, quiz generation). A single-row table with a
-- conditional UPDATE works correctly with a transaction-mode pooler
-- (pgbouncer/Supavisor), unlike pg_advisory_lock which needs a session-level
-- connection that a transaction pooler does not guarantee.

create table if not exists public.ai_lock (
  id boolean primary key default true,
  locked_at timestamptz,
  locked_by text,
  constraint ai_lock_single_row check (id = true)
);

insert into public.ai_lock (id, locked_at, locked_by)
values (true, null, null)
on conflict (id) do nothing;

alter table public.ai_lock enable row level security;
-- No policies are defined on purpose: only the service_role key (which
-- bypasses RLS) may read or write this table. Regular users have no access.

-- Attempts to acquire the lock. Succeeds (returns true) if the lock is free,
-- or if it is currently held but has been held for longer than
-- `stale_after_seconds` (a crashed request could otherwise hold it forever).
create or replace function public.try_acquire_ai_lock(
  holder text,
  stale_after_seconds int default 120
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  acquired int := 0;
begin
  update public.ai_lock
  set locked_at = now(), locked_by = holder
  where id = true
    and (
      locked_by is null
      or locked_at is null
      or locked_at < now() - make_interval(secs => stale_after_seconds)
    );

  get diagnostics acquired = row_count;
  return acquired > 0;
end;
$$;

-- Releases the lock, but only if it is still held by `holder` (prevents a
-- slow/late release from clobbering a lock a different holder has since
-- legitimately acquired, e.g. after a stale takeover).
create or replace function public.release_ai_lock(holder text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  released int;
begin
  update public.ai_lock
  set locked_at = null, locked_by = null
  where id = true and locked_by = holder;

  get diagnostics released = row_count;
  return released > 0;
end;
$$;
