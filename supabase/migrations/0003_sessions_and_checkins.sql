-- =============================================================================
-- Migration 0003 : suivi d'exécution des programmes et check-ins quotidiens.
--
-- Cette migration ajoute les tables permettant au patient de suivre sa
-- progression dans un programme (sessions + complétions d'exercices), et
-- d'enregistrer un check-in quotidien (humeur, jour de repos volontaire).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: program_sessions
-- Représente un passage du patient sur un programme, du démarrage jusqu'à la
-- validation finale. perceived_effort suit une échelle de Borg simplifiée (1-5).
-- -----------------------------------------------------------------------------
create table public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  perceived_effort smallint check (perceived_effort between 1 and 5),
  feedback_note text
);

create index program_sessions_patient_idx on public.program_sessions(patient_id);
create index program_sessions_program_idx on public.program_sessions(program_id);
create index program_sessions_active_idx
  on public.program_sessions(patient_id, program_id)
  where completed_at is null;

alter table public.program_sessions enable row level security;

create policy "program_sessions: patient read own"
  on public.program_sessions for select
  to authenticated
  using (patient_id = auth.uid());

create policy "program_sessions: patient insert own"
  on public.program_sessions for insert
  to authenticated
  with check (patient_id = auth.uid());

create policy "program_sessions: patient update own"
  on public.program_sessions for update
  to authenticated
  using (patient_id = auth.uid());

create policy "program_sessions: patient delete own"
  on public.program_sessions for delete
  to authenticated
  using (patient_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Table: exercise_completions
-- Chaque ligne = un exercice coché comme fait dans une session donnée.
-- -----------------------------------------------------------------------------
create table public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.program_sessions(id) on delete cascade,
  program_exercise_id uuid not null references public.program_exercises(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (session_id, program_exercise_id)
);

create index exercise_completions_session_idx on public.exercise_completions(session_id);

alter table public.exercise_completions enable row level security;

create policy "exercise_completions: patient read own"
  on public.exercise_completions for select
  to authenticated
  using (exists (
    select 1 from public.program_sessions s
    where s.id = session_id and s.patient_id = auth.uid()
  ));

create policy "exercise_completions: patient insert own"
  on public.exercise_completions for insert
  to authenticated
  with check (exists (
    select 1 from public.program_sessions s
    where s.id = session_id and s.patient_id = auth.uid()
  ));

create policy "exercise_completions: patient delete own"
  on public.exercise_completions for delete
  to authenticated
  using (exists (
    select 1 from public.program_sessions s
    where s.id = session_id and s.patient_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- Table: daily_checkins
-- Une ligne par patient par jour. mood 1..3 = faible / moyen / bien.
-- rest_requested = le patient a cliqué sur "J'écoute mon corps" (jour de repos
-- volontaire). Cette information sera utile au kiné par la suite.
-- -----------------------------------------------------------------------------
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  mood smallint check (mood between 1 and 3),
  rest_requested boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  unique (patient_id, date)
);

create index daily_checkins_patient_date_idx
  on public.daily_checkins(patient_id, date desc);

alter table public.daily_checkins enable row level security;

create policy "daily_checkins: patient read own"
  on public.daily_checkins for select
  to authenticated
  using (patient_id = auth.uid());

create policy "daily_checkins: patient upsert own"
  on public.daily_checkins for insert
  to authenticated
  with check (patient_id = auth.uid());

create policy "daily_checkins: patient update own"
  on public.daily_checkins for update
  to authenticated
  using (patient_id = auth.uid());
