-- Postgres doesn't auto-index foreign keys the way it does primary keys.
-- subjects/chapters/exams are all filtered by `user_id` on nearly every
-- page load (Fiches, Planning, Examen, Quiz), and had no index backing
-- that filter — every one of those queries was doing a full table scan.
-- Harmless at today's row counts, but a real, easy-to-fix latency
-- contributor as data grows, and consistent with the indexes that already
-- exist on fiches/chapters(subject_id)/planning_tasks/fiche_drafts.
create index if not exists subjects_user_id_idx on public.subjects (user_id);
create index if not exists chapters_user_id_idx on public.chapters (user_id);
create index if not exists exams_user_id_idx on public.exams (user_id);
