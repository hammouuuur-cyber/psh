// Types miroir du schéma Postgres.
// Peut être régénéré avec `npx supabase gen types typescript --project-id <id>`
// une fois le projet Supabase lié.

export type Role = 'patient' | 'kine';

export type Profile = {
  id: string;
  role: Role;
  display_name: string | null;
  interests: string[]; // codes pathologies
  goals: string[];    // codes objectifs thérapeutiques
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

export type ProgramSession = {
  id: string;
  patient_id: string;
  program_id: string;
  started_at: string;
  completed_at: string | null;
  perceived_effort: number | null;
  feedback_note: string | null;
};

export type ExerciseCompletion = {
  id: string;
  session_id: string;
  program_exercise_id: string;
  completed_at: string;
};

/** 1 = faible énergie, 2 = correct, 3 = en forme. */
export type MoodLevel = 1 | 2 | 3;

export type DailyCheckin = {
  id: string;
  patient_id: string;
  date: string; // YYYY-MM-DD
  mood: MoodLevel | null;
  rest_requested: boolean;
  note: string | null;
  created_at: string;
};

export type CareLink = {
  id: string;
  kine_id: string;
  patient_id: string;
  status: 'active' | 'revoked';
  created_at: string;
};

export type InvitationCode = {
  code: string;
  kine_id: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  care_link_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
