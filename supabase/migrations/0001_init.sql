-- Revix initial schema
-- All tables use Row Level Security scoped to auth.uid() = user_id
-- (except join tables, which check ownership through their parent).

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text,
  classe_cycle text check (classe_cycle in ('college', 'lycee', 'superieur')),
  classe_niveau text,
  onboarding_completed boolean not null default false,
  revision_jours_semaine int not null default 4 check (revision_jours_semaine between 1 and 7),
  revision_minutes_jour int not null default 30 check (revision_minutes_jour > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- generic updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- subjects (matieres)
-- ---------------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  created_at timestamptz not null default now(),
  unique (user_id, nom)
);

alter table public.subjects enable row level security;

create policy "subjects_select_own" on public.subjects
  for select using (auth.uid() = user_id);
create policy "subjects_insert_own" on public.subjects
  for insert with check (auth.uid() = user_id);
create policy "subjects_update_own" on public.subjects
  for update using (auth.uid() = user_id);
create policy "subjects_delete_own" on public.subjects
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- chapters
-- ---------------------------------------------------------------------------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  created_at timestamptz not null default now(),
  unique (subject_id, nom)
);

create index if not exists chapters_subject_id_idx on public.chapters (subject_id);

alter table public.chapters enable row level security;

create policy "chapters_select_own" on public.chapters
  for select using (auth.uid() = user_id);
create policy "chapters_insert_own" on public.chapters
  for insert with check (auth.uid() = user_id);
create policy "chapters_update_own" on public.chapters
  for update using (auth.uid() = user_id);
create policy "chapters_delete_own" on public.chapters
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- fiches
-- ---------------------------------------------------------------------------
create table if not exists public.fiches (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  titre text not null,
  -- { plan: [{ numero, titre, sousPoints: [{ lettre, texte }] }], aRetenir: string[] }
  contenu jsonb not null,
  sources jsonb not null default '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fiches_chapter_id_idx on public.fiches (chapter_id);
create index if not exists fiches_user_id_deleted_at_idx on public.fiches (user_id, deleted_at);

alter table public.fiches enable row level security;

create policy "fiches_select_own" on public.fiches
  for select using (auth.uid() = user_id);
create policy "fiches_insert_own" on public.fiches
  for insert with check (auth.uid() = user_id);
create policy "fiches_update_own" on public.fiches
  for update using (auth.uid() = user_id);
create policy "fiches_delete_own" on public.fiches
  for delete using (auth.uid() = user_id);

create trigger fiches_set_updated_at
  before update on public.fiches
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- exams
-- ---------------------------------------------------------------------------
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  date date not null,
  importance text not null check (importance in ('normale', 'importante', 'tres_importante')),
  created_at timestamptz not null default now()
);

alter table public.exams enable row level security;

create policy "exams_select_own" on public.exams
  for select using (auth.uid() = user_id);
create policy "exams_insert_own" on public.exams
  for insert with check (auth.uid() = user_id);
create policy "exams_update_own" on public.exams
  for update using (auth.uid() = user_id);
create policy "exams_delete_own" on public.exams
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exam_chapters (join table)
-- ---------------------------------------------------------------------------
create table if not exists public.exam_chapters (
  exam_id uuid not null references public.exams (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  primary key (exam_id, chapter_id)
);

alter table public.exam_chapters enable row level security;

create policy "exam_chapters_select_own" on public.exam_chapters
  for select using (
    exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid())
  );
create policy "exam_chapters_insert_own" on public.exam_chapters
  for insert with check (
    exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid())
  );
create policy "exam_chapters_delete_own" on public.exam_chapters
  for delete using (
    exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- planning_tasks
-- ---------------------------------------------------------------------------
create table if not exists public.planning_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid references public.exams (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  date date not null,
  type text not null check (type in ('decouverte', 'rappel')),
  parties jsonb not null default '[]'::jsonb,
  duree_minutes int not null default 20,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists planning_tasks_user_id_date_idx on public.planning_tasks (user_id, date);

alter table public.planning_tasks enable row level security;

create policy "planning_tasks_select_own" on public.planning_tasks
  for select using (auth.uid() = user_id);
create policy "planning_tasks_insert_own" on public.planning_tasks
  for insert with check (auth.uid() = user_id);
create policy "planning_tasks_update_own" on public.planning_tasks
  for update using (auth.uid() = user_id);
create policy "planning_tasks_delete_own" on public.planning_tasks
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- quizzes
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  difficulty text not null check (difficulty in ('facile', 'moyen', 'difficile')),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  -- [{ question, choix: string[4], reponseIndex, explication }]
  questions jsonb not null default '[]'::jsonb,
  source_fiches_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chapter_id, difficulty)
);

alter table public.quizzes enable row level security;

create policy "quizzes_select_own" on public.quizzes
  for select using (auth.uid() = user_id);
create policy "quizzes_insert_own" on public.quizzes
  for insert with check (auth.uid() = user_id);
create policy "quizzes_update_own" on public.quizzes
  for update using (auth.uid() = user_id);
create policy "quizzes_delete_own" on public.quizzes
  for delete using (auth.uid() = user_id);

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quiz_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  difficulty text not null check (difficulty in ('facile', 'moyen', 'difficile')),
  score int not null,
  total int not null default 10,
  reponses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_lookup_idx
  on public.quiz_attempts (user_id, chapter_id, difficulty, created_at desc);

alter table public.quiz_attempts enable row level security;

create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (auth.uid() = user_id);
create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  fiches_generated_period int not null default 0,
  period_start timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Owners can only read their own row; all writes happen through the
-- service_role key (Stripe webhooks), never directly from the client.
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();
