-- "Objectif de note" (goal-driven exam planning) + grades/weighted average.
--
-- Pure additive migration: new nullable/defaulted columns on the existing
-- `exams` and `profiles` tables, no new tables. Row Level Security is
-- already enabled on both (see 0001_init.sql's exams_select_own /
-- profiles_select_own etc.) and RLS applies per-row, not per-column, so
-- these new columns are automatically covered by those same policies —
-- nothing here can be read or written by anyone but the row's own
-- user_id. No new `create policy` statements are needed.
--
-- All grade/average values are stored on a /20 scale regardless of the
-- student's display language or chosen scale (see lib/i18n/grade-scale.ts)
-- — /10 and percent are purely a display-time conversion, never stored.

alter table public.exams
  -- The new "Objectif de note" wizard (Part A) creates an exam by picking
  -- a whole subject (not individual chapters like the old ExamForm did) —
  -- this is the first-class link that replaces inferring the subject from
  -- exam_chapters -> chapters -> subject_id, which broke down for a
  -- subject with no chapters yet. Nullable: an exam created before this
  -- migration has no subject_id and keeps working exactly as before
  -- (exam_chapters is untouched and still drives the planning scheduler).
  add column if not exists subject_id uuid references public.subjects (id) on delete set null,
  add column if not exists coefficient int not null default 1 check (coefficient between 1 and 20),
  -- The goal grade set for this exam in the wizard (Part A) — null for any
  -- exam created before this migration, or if the wizard is ever skipped.
  add column if not exists note_visee numeric(4, 1) check (note_visee is null or note_visee between 0 and 20),
  -- The "current average in this subject" the student declared (or that
  -- was pre-filled from their real recorded average) when the goal was
  -- set — kept distinct from note_obtenue so the wizard can show "you
  -- started at X" even after a real grade comes in.
  add column if not exists moyenne_declaree_depart numeric(4, 1)
    check (moyenne_declaree_depart is null or moyenne_declaree_depart between 0 and 20),
  -- The actual grade obtained, entered once the exam date has passed
  -- (Part B). Null = "à venir" (upcoming) — never treated as a zero.
  add column if not exists note_obtenue numeric(4, 1) check (note_obtenue is null or note_obtenue between 0 and 20),
  add column if not exists date_saisie_note timestamptz;

create index if not exists exams_subject_id_idx on public.exams (subject_id);

alter table public.profiles
  -- Overall average goal (Part B's "objectif de moyenne"), independent of
  -- any single exam's own note_visee.
  add column if not exists objectif_moyenne numeric(4, 1) not null default 10
    check (objectif_moyenne between 0 and 20),
  -- Manual override for which scale grades/averages display in (see
  -- lib/i18n/grade-scale.ts's GradeScale type) — null means "use the
  -- default for the student's current language" (fr -> /20, es -> /10,
  -- en -> percent) rather than a fixed scale that would survive a
  -- language switch.
  add column if not exists echelle_note text
    check (echelle_note is null or echelle_note in ('vingt', 'dix', 'pourcentage'));
