-- Temporary storage for generated-but-not-yet-saved fiches. The
-- matière/chapitre assignment step now happens after we know the user has
-- an active subscription, which for a not-yet-subscribed user means a full
-- page navigation away to Stripe Checkout and back — the in-memory review
-- state can't survive that round trip, so it's persisted here instead.
-- Rows are deleted once the fiches are actually saved (see
-- app/api/fiches/drafts/[draftId]/route.ts); an abandoned draft is
-- harmless and can be cleaned up later by age if needed.
create table if not exists public.fiche_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- [{ titre, contenu }], shape matches FicheProposal in lib/fiches/types.ts
  items jsonb not null,
  -- shared across all items in the draft, shape matches FicheSource[]
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists fiche_drafts_user_id_idx on public.fiche_drafts (user_id);

alter table public.fiche_drafts enable row level security;

create policy "fiche_drafts_select_own" on public.fiche_drafts
  for select using (auth.uid() = user_id);
create policy "fiche_drafts_insert_own" on public.fiche_drafts
  for insert with check (auth.uid() = user_id);
create policy "fiche_drafts_delete_own" on public.fiche_drafts
  for delete using (auth.uid() = user_id);
