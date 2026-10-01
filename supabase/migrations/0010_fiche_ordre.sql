-- A fiche the model splits into "Partie 1", "Partie 2", ... (see
-- lib/anthropic/prompts.ts) is saved as several rows in the same POST
-- /api/fiches request, one at a time. `ordre` records each one's position
-- within that batch so the chapter's fiche list can show them in the
-- right order even though per-row created_at values a few ms apart would
-- otherwise sort them out of sequence — see app/api/fiches/route.ts (which
-- now also gives every row in one batch the same created_at) and
-- app/(app)/fiches/[subjectId]/[chapterId]/page.tsx's query.
alter table public.fiches
  add column if not exists ordre integer not null default 0;
