-- 3 new onboarding qualification screens (blocages, méthode de révision,
-- prochain examen — see lib/onboarding/qualification.ts) need somewhere
-- to save their answers. A single jsonb column, filled in incrementally
-- as each screen is answered, rather than 3 separate typed columns, since
-- the shape may grow and these answers are never queried/filtered on.
alter table public.profiles
  add column if not exists onboarding_reponses jsonb not null default '{}';
