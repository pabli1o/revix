-- One free fiche generation for an account with no active subscription —
-- see app/api/fiches/generate/route.ts and lib/subscription/gate.ts
-- (assertFreeFicheTrialAvailable/markFreeFicheGenerated). A boolean is
-- enough since the cap is exactly 1, ever, regardless of how many
-- underlying chunk requests one "Générer la fiche" click produces.
alter table public.profiles
  add column if not exists free_fiche_generated boolean not null default false;
