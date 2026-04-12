// Types miroir du schéma Postgres.
// Peut être régénéré avec `npx supabase gen types typescript --project-id <id>`
// une fois le projet Supabase lié.

export type Role = 'patient' | 'kine';

export type Profile = {
  id: string;
  role: Role;
  display_name: string | null;
  interests: string[]; // codes pathologies
  created_at: string;
};

export type Pathology = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type Exercise = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  is_public: boolean;
  difficulty: number;
  default_reps: number | null;
  default_sets: number | null;
  default_duration_sec: number | null;
  default_rest_sec: number | null;
  created_at: string;
};

export type ExerciseAsset = {
  id: string;
  exercise_id: string;
  kind: 'video' | 'image';
  storage_path: string;
  order: number;
  created_at: string;
};

export type Program = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  is_public: boolean;
  created_at: string;
};

export type ProgramExercise = {
  id: string;
  program_id: string;
  exercise_id: string;
  order: number;
  reps: number | null;
  sets: number | null;
  duration_sec: number | null;
  rest_sec: number | null;
  notes: string | null;
};

export type Subscription = {
  patient_id: string;
  program_id: string;
  added_at: string;
};
