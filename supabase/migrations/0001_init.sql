-- =============================================================================
-- Schéma initial : application d'exercices de kiné pour maladies neuromusculaires
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: profiles (liée à auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'kine')),
  display_name text,
  interests jsonb not null default '[]'::jsonb, -- liste de codes pathologies pour le patient
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: self can select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self can insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: self can update"
  on public.profiles for update
  using (auth.uid() = id);

-- Fonction utilitaire : is_kine ?
create or replace function public.is_kine(uid uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'kine'
  );
$$;

-- -----------------------------------------------------------------------------
-- Table: pathologies (référentiel)
-- -----------------------------------------------------------------------------
create table public.pathologies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text
);

alter table public.pathologies enable row level security;

create policy "pathologies: read for authenticated"
  on public.pathologies for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Table: exercises
-- -----------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  default_reps int,
  default_sets int,
  default_duration_sec int,
  default_rest_sec int default 15,
  created_at timestamptz not null default now()
);

create index exercises_created_by_idx on public.exercises(created_by);
create index exercises_is_public_idx on public.exercises(is_public);

alter table public.exercises enable row level security;

create policy "exercises: read public or own"
  on public.exercises for select
  to authenticated
  using (is_public = true or created_by = auth.uid());

create policy "exercises: kine can insert own"
  on public.exercises for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_kine(auth.uid()));

create policy "exercises: kine can update own"
  on public.exercises for update
  to authenticated
  using (created_by = auth.uid() and public.is_kine(auth.uid()));

create policy "exercises: kine can delete own"
  on public.exercises for delete
  to authenticated
  using (created_by = auth.uid() and public.is_kine(auth.uid()));

-- -----------------------------------------------------------------------------
-- Table: exercise_pathologies (N-N)
-- -----------------------------------------------------------------------------
create table public.exercise_pathologies (
  exercise_id uuid references public.exercises(id) on delete cascade,
  pathology_id uuid references public.pathologies(id) on delete cascade,
  primary key (exercise_id, pathology_id)
);

alter table public.exercise_pathologies enable row level security;

create policy "exercise_pathologies: read if parent readable"
  on public.exercise_pathologies for select
  to authenticated
  using (exists (
    select 1 from public.exercises e
    where e.id = exercise_id
      and (e.is_public = true or e.created_by = auth.uid())
  ));

create policy "exercise_pathologies: write if owner kine"
  on public.exercise_pathologies for all
  to authenticated
  using (exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.created_by = auth.uid() and public.is_kine(auth.uid())
  ))
  with check (exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.created_by = auth.uid() and public.is_kine(auth.uid())
  ));

-- -----------------------------------------------------------------------------
-- Table: exercise_assets (vidéos / images)
-- -----------------------------------------------------------------------------
create table public.exercise_assets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  kind text not null check (kind in ('video', 'image')),
  storage_path text not null,
  "order" int not null default 0,
  created_at timestamptz not null default now()
);

create index exercise_assets_exercise_id_idx on public.exercise_assets(exercise_id);

alter table public.exercise_assets enable row level security;

create policy "exercise_assets: read if parent readable"
  on public.exercise_assets for select
  to authenticated
  using (exists (
    select 1 from public.exercises e
    where e.id = exercise_id
      and (e.is_public = true or e.created_by = auth.uid())
  ));

create policy "exercise_assets: write if owner kine"
  on public.exercise_assets for all
  to authenticated
  using (exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.created_by = auth.uid() and public.is_kine(auth.uid())
  ))
  with check (exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.created_by = auth.uid() and public.is_kine(auth.uid())
  ));

-- -----------------------------------------------------------------------------
-- Table: programs
-- -----------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index programs_created_by_idx on public.programs(created_by);
create index programs_is_public_idx on public.programs(is_public);

alter table public.programs enable row level security;

create policy "programs: read public or own"
  on public.programs for select
  to authenticated
  using (is_public = true or created_by = auth.uid());

create policy "programs: kine can insert own"
  on public.programs for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_kine(auth.uid()));

create policy "programs: kine can update own"
  on public.programs for update
  to authenticated
  using (created_by = auth.uid() and public.is_kine(auth.uid()));

create policy "programs: kine can delete own"
  on public.programs for delete
  to authenticated
  using (created_by = auth.uid() and public.is_kine(auth.uid()));

-- -----------------------------------------------------------------------------
-- Table: program_pathologies (N-N)
-- -----------------------------------------------------------------------------
create table public.program_pathologies (
  program_id uuid references public.programs(id) on delete cascade,
  pathology_id uuid references public.pathologies(id) on delete cascade,
  primary key (program_id, pathology_id)
);

alter table public.program_pathologies enable row level security;

create policy "program_pathologies: read if parent readable"
  on public.program_pathologies for select
  to authenticated
  using (exists (
    select 1 from public.programs p
    where p.id = program_id
      and (p.is_public = true or p.created_by = auth.uid())
  ));

create policy "program_pathologies: write if owner kine"
  on public.program_pathologies for all
  to authenticated
  using (exists (
    select 1 from public.programs p
    where p.id = program_id and p.created_by = auth.uid() and public.is_kine(auth.uid())
  ))
  with check (exists (
    select 1 from public.programs p
    where p.id = program_id and p.created_by = auth.uid() and public.is_kine(auth.uid())
  ));

-- -----------------------------------------------------------------------------
-- Table: program_exercises (ordre + overrides reps/séries)
-- -----------------------------------------------------------------------------
create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  "order" int not null default 0,
  reps int,
  sets int,
  duration_sec int,
  rest_sec int,
  notes text,
  unique (program_id, exercise_id, "order")
);

create index program_exercises_program_id_idx on public.program_exercises(program_id);

alter table public.program_exercises enable row level security;

create policy "program_exercises: read if parent readable"
  on public.program_exercises for select
  to authenticated
  using (exists (
    select 1 from public.programs p
    where p.id = program_id
      and (p.is_public = true or p.created_by = auth.uid())
  ));

create policy "program_exercises: write if owner kine"
  on public.program_exercises for all
  to authenticated
  using (exists (
    select 1 from public.programs p
    where p.id = program_id and p.created_by = auth.uid() and public.is_kine(auth.uid())
  ))
  with check (exists (
    select 1 from public.programs p
    where p.id = program_id and p.created_by = auth.uid() and public.is_kine(auth.uid())
  ));

-- -----------------------------------------------------------------------------
-- Table: subscriptions (abonnement patient -> programme)
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  patient_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (patient_id, program_id)
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: patient can select own"
  on public.subscriptions for select
  to authenticated
  using (patient_id = auth.uid());

create policy "subscriptions: patient can insert own"
  on public.subscriptions for insert
  to authenticated
  with check (patient_id = auth.uid());

create policy "subscriptions: patient can delete own"
  on public.subscriptions for delete
  to authenticated
  using (patient_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Storage buckets (à créer via dashboard OU via la commande ci-dessous)
-- -----------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public) values
--   ('exercise-videos', 'exercise-videos', false),
--   ('exercise-images', 'exercise-images', false)
-- on conflict (id) do nothing;

-- Policies Storage : lecture pour les utilisateurs authentifiés,
-- écriture réservée aux kinés (sur leurs propres uploads via le préfixe user_id/).
-- create policy "storage: auth can read exercise media"
--   on storage.objects for select
--   to authenticated
--   using (bucket_id in ('exercise-videos', 'exercise-images'));
--
-- create policy "storage: kine can upload own"
--   on storage.objects for insert
--   to authenticated
--   with check (
--     bucket_id in ('exercise-videos', 'exercise-images')
--     and public.is_kine(auth.uid())
--     and (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- create policy "storage: kine can delete own"
--   on storage.objects for delete
--   to authenticated
--   using (
--     bucket_id in ('exercise-videos', 'exercise-images')
--     and (storage.foldername(name))[1] = auth.uid()::text
--   );
