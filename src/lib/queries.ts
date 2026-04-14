import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';
import type {
  DailyCheckin,
  Exercise,
  ExerciseCompletion,
  Pathology,
  Program,
  ProgramExercise,
  ProgramSession,
} from '@/types/database';

export function usePathologies() {
  return useQuery({
    queryKey: ['pathologies'],
    queryFn: async (): Promise<Pathology[]> => {
      const { data, error } = await supabase.from('pathologies').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as Pathology[];
    },
  });
}

export function usePublicExercises(pathologyCodes?: string[]) {
  return useQuery({
    queryKey: ['exercises', 'public', pathologyCodes],
    queryFn: async (): Promise<Exercise[]> => {
      let query = supabase
        .from('exercises')
        .select('*, exercise_pathologies(pathology_id, pathologies(code))')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as (Exercise & {
        exercise_pathologies?: { pathologies: { code: string } | null }[];
      })[];

      if (!pathologyCodes || pathologyCodes.length === 0) return rows;

      return rows.filter((ex) =>
        ex.exercise_pathologies?.some((xp) =>
          xp.pathologies ? pathologyCodes.includes(xp.pathologies.code) : false,
        ),
      );
    },
  });
}

export function useMyExercises(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ['exercises', 'mine', userId],
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('created_by', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Exercise[];
    },
  });
}

export function usePublicPrograms(pathologyCodes?: string[]) {
  return useQuery({
    queryKey: ['programs', 'public', pathologyCodes],
    queryFn: async (): Promise<Program[]> => {
      const { data, error } = await supabase
        .from('programs')
        .select('*, program_pathologies(pathology_id, pathologies(code))')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as (Program & {
        program_pathologies?: { pathologies: { code: string } | null }[];
      })[];
      if (!pathologyCodes || pathologyCodes.length === 0) return rows;
      return rows.filter((p) =>
        p.program_pathologies?.some((pp) =>
          pp.pathologies ? pathologyCodes.includes(pp.pathologies.code) : false,
        ),
      );
    },
  });
}

export function useMyPrograms(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ['programs', 'mine', userId],
    queryFn: async (): Promise<Program[]> => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('created_by', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Program[];
    },
  });
}

export function useSubscribedPrograms(patientId: string | undefined) {
  return useQuery({
    enabled: !!patientId,
    queryKey: ['programs', 'subscribed', patientId],
    queryFn: async (): Promise<Program[]> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('program_id, programs(*)')
        .eq('patient_id', patientId!);
      if (error) throw error;
      return ((data ?? []) as { programs: Program | null }[])
        .map((row) => row.programs)
        .filter((p): p is Program => p !== null);
    },
  });
}

export function useProgramDetail(programId: string | undefined) {
  return useQuery({
    enabled: !!programId,
    queryKey: ['program', programId],
    queryFn: async () => {
      const { data: program, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId!)
        .maybeSingle();
      if (error) throw error;

      const { data: items, error: err2 } = await supabase
        .from('program_exercises')
        .select('*, exercises(*)')
        .eq('program_id', programId!)
        .order('order');
      if (err2) throw err2;

      return {
        program: program as Program | null,
        items: (items ?? []) as (ProgramExercise & { exercises: Exercise })[],
      };
    },
  });
}

export function useExerciseDetail(exerciseId: string | undefined) {
  return useQuery({
    enabled: !!exerciseId,
    queryKey: ['exercise', exerciseId],
    queryFn: async () => {
      const { data: exercise, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId!)
        .maybeSingle();
      if (error) throw error;

      const { data: assets, error: err2 } = await supabase
        .from('exercise_assets')
        .select('*')
        .eq('exercise_id', exerciseId!)
        .order('order');
      if (err2) throw err2;

      return {
        exercise: exercise as Exercise | null,
        assets: (assets ?? []) as import('@/types/database').ExerciseAsset[],
      };
    },
  });
}

/**
 * Dernière session active du patient sur un programme (completed_at IS NULL).
 * Retourne `null` si aucune session n'est en cours.
 */
export function useActiveSession(patientId: string | undefined, programId: string | undefined) {
  return useQuery({
    enabled: !!patientId && !!programId,
    queryKey: ['program_session', 'active', patientId, programId],
    queryFn: async (): Promise<ProgramSession | null> => {
      const { data, error } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('patient_id', patientId!)
        .eq('program_id', programId!)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as ProgramSession | null) ?? null;
    },
  });
}

/** Exercices déjà marqués comme faits dans une session donnée. */
export function useSessionCompletions(sessionId: string | undefined) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: ['exercise_completions', sessionId],
    queryFn: async (): Promise<ExerciseCompletion[]> => {
      const { data, error } = await supabase
        .from('exercise_completions')
        .select('*')
        .eq('session_id', sessionId!);
      if (error) throw error;
      return (data ?? []) as ExerciseCompletion[];
    },
  });
}

/** Historique des sessions terminées. */
export function useProgramHistory(patientId: string | undefined, programId: string | undefined) {
  return useQuery({
    enabled: !!patientId && !!programId,
    queryKey: ['program_session', 'history', patientId, programId],
    queryFn: async (): Promise<ProgramSession[]> => {
      const { data, error } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('patient_id', patientId!)
        .eq('program_id', programId!)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as ProgramSession[];
    },
  });
}

/** Check-in quotidien du patient pour aujourd'hui (null si aucun). */
export function useTodayCheckin(patientId: string | undefined) {
  return useQuery({
    enabled: !!patientId,
    queryKey: ['daily_checkin', 'today', patientId],
    queryFn: async (): Promise<DailyCheckin | null> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('patient_id', patientId!)
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      return (data as DailyCheckin | null) ?? null;
    },
  });
}

/** Sessions récentes du patient sur les N derniers jours, pour la jauge de régularité. */
export function useRecentActivity(patientId: string | undefined, days: number = 14) {
  return useQuery({
    enabled: !!patientId,
    queryKey: ['recent_activity', patientId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();

      const [sessions, checkins] = await Promise.all([
        supabase
          .from('program_sessions')
          .select('id, completed_at')
          .eq('patient_id', patientId!)
          .not('completed_at', 'is', null)
          .gte('completed_at', sinceStr),
        supabase
          .from('daily_checkins')
          .select('date, rest_requested, mood')
          .eq('patient_id', patientId!)
          .gte('date', since.toISOString().slice(0, 10)),
      ]);

      if (sessions.error) throw sessions.error;
      if (checkins.error) throw checkins.error;

      // Ensemble des dates (YYYY-MM-DD) où une séance a été validée
      // OU un jour de repos a été signalé — on compte les deux comme
      // « jour pris en main » pour la jauge de régularité.
      const dates = new Set<string>();
      for (const s of sessions.data ?? []) {
        if (s.completed_at) dates.add(String(s.completed_at).slice(0, 10));
      }
      for (const c of checkins.data ?? []) {
        if (c.rest_requested) dates.add(c.date);
      }

      return {
        days,
        activeDays: dates.size,
        dates: Array.from(dates).sort(),
      };
    },
  });
}
