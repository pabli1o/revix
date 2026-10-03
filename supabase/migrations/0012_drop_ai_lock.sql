-- Drops the global AI lock introduced in 0002_ai_lock.sql. It served to
-- keep fiche and quiz generation from ever running concurrently anywhere
-- in the app, but fiche generation now deliberately fires several chunks
-- of the same upload in parallel (see creation-flow.tsx) — the lock just
-- queued those parallel calls back into a single-file line, and started
-- throwing "Une autre génération est déjà en cours" for whichever ones
-- got stuck waiting behind the others. Nothing else depended on this
-- serialization (usage cost is recorded via the atomic
-- increment_ai_usage_cost from 0007_ai_usage_budget.sql, independent of
-- this lock), so it's removed rather than adapted.
drop function if exists public.try_acquire_ai_lock(text, int);
drop function if exists public.release_ai_lock(text);
drop table if exists public.ai_lock;
