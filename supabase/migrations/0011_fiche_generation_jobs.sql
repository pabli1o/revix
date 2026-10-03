-- Async job tracking for fiche generation via the Anthropic Message
-- Batches API (see lib/anthropic/client.ts's submitBatch/checkBatch).
-- Unlike quiz background prefetch — which still runs inside a Vercel
-- function's after() and shares its 60s duration budget — a batch runs
-- entirely on Anthropic's own infrastructure and can legitimately take
-- minutes, so it needs to be durably tracked across many separate poll
-- requests instead of just awaited within one request.
create table if not exists public.fiche_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  anthropic_batch_id text,
  -- FicheProposal[] (see lib/fiches/types.ts), set once status = 'ready'.
  proposals jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fiche_generation_jobs_user_id_idx on public.fiche_generation_jobs (user_id);

alter table public.fiche_generation_jobs enable row level security;

-- All writes happen through the service_role key (submit route inserts,
-- status route finalizes on poll) — the client only ever reads its own
-- job rows directly via this policy.
create policy "fiche_generation_jobs_select_own" on public.fiche_generation_jobs
  for select using (auth.uid() = user_id);

create trigger fiche_generation_jobs_set_updated_at
  before update on public.fiche_generation_jobs
  for each row execute procedure public.set_updated_at();
