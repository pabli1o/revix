-- Corrects exams.coefficient to half-point steps, and adds the
-- onboarding flow's starting general average.
--
-- Safe to run whether 0016 was already applied (coefficient already
-- exists as the original `int ... check (between 1 and 20)`) or not (a
-- database that has never run any migration at all) — every statement
-- below is written to succeed either way, so this file and 0016 can be
-- run in either order, or 0017 alone against a fresh database that
-- already has 0016's *current* version (see that file's own comment).
--
-- Chapters covered by an exam: the "Ajouter un examen" wizard now lets
-- the student pick specific chapters instead of the whole subject. No
-- schema change needed for that — the exam_chapters junction table
-- (supabase/migrations/0001_init.sql) already links an exam to any set
-- of chapters and already has its own RLS; the wizard just writes a
-- chosen subset to it now instead of every chapter in the subject.

-- 1) coefficient: int, 1-20 -> numeric(3,1), 0.5-20, in half-point steps.
alter table public.exams add column if not exists coefficient numeric(3, 1) not null default 1;
alter table public.exams alter column coefficient type numeric(3, 1) using coefficient::numeric(3, 1);
alter table public.exams alter column coefficient set default 1;
alter table public.exams alter column coefficient set not null;
-- Drops whatever the column's check was called before (the name Postgres
-- auto-generates for an inline, unnamed check — exams_coefficient_check —
-- or this same named one from a previous run of this file) and replaces
-- it with the half-point range, under a name we control so this stays
-- re-runnable.
alter table public.exams drop constraint if exists exams_coefficient_check;
alter table public.exams drop constraint if exists exams_coefficient_range_check;
alter table public.exams add constraint exams_coefficient_range_check check (coefficient between 0.5 and 20);

-- 2) The "quelle est ta moyenne générale ?" onboarding screen's starting
-- value — distinct from objectif_moyenne (0016), which is the goal, not
-- the starting point, and from exams.moyenne_declaree_depart, which is
-- per-subject rather than this one general, pre-signup figure.
alter table public.profiles
  add column if not exists moyenne_generale_depart numeric(4, 1)
    check (moyenne_generale_depart is null or moyenne_generale_depart between 0 and 20);
