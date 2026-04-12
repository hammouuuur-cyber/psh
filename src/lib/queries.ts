import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';
import type { Exercise, Pathology, Program, ProgramExercise } from '@/types/database';

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
