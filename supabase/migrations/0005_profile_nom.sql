-- Adds a last-name field alongside the existing prenom, so the Paramètres
-- page can offer full name editing (prénom + nom), not just prénom.
alter table public.profiles add column if not exists nom text;
