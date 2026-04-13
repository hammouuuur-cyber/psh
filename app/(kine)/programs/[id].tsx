import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/AuthContext';
import { useMyExercises } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { Exercise, ProgramExercise } from '@/types/database';

type ProgramItem = ProgramExercise & { exercises: Exercise };

function exerciseSummary(ex: Pick<Exercise, 'default_sets' | 'default_reps' | 'default_duration_sec' | 'default_rest_sec'>) {
  const parts: string[] = [];
  if (ex.default_sets) parts.push(`${ex.default_sets} séries`);
  if (ex.default_reps) parts.push(`${ex.default_reps} reps`);
  if (ex.default_duration_sec) parts.push(`${ex.default_duration_sec}s`);
  if (ex.default_rest_sec) parts.push(`repos ${ex.default_rest_sec}s`);
  return parts.join(' · ') || 'Pas de consignes par défaut';
}

export default function KineProgramEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [pathologies, setPathologies] = useState<string[]>([]);
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const { data: myExercises } = useMyExercises(session?.user?.id);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data: prog } = await supabase.from('programs').select('*').eq('id', id).maybeSingle();
      if (prog) {
        setTitle(prog.title);
        setDescription(prog.description ?? '');
        setIsPublic(prog.is_public);
      }

      const { data: pp } = await supabase
        .from('program_pathologies')
        .select('pathologies(code)')
        .eq('program_id', id);
      setPathologies(
        ((pp ?? []) as { pathologies: { code: string } | null }[])
          .map((r) => r.pathologies?.code)
          .filter((c): c is string => !!c),
      );

      await reloadItems(id as string);
      setLoading(false);
    })();
  }, [id, isNew]);

  const reloadItems = async (programId: string) => {
    const { data: pe } = await supabase
      .from('program_exercises')
      .select('*, exercises(*)')
      .eq('program_id', programId)
      .order('order');
    setItems((pe ?? []) as ProgramItem[]);
  };

  const saveProgram = async () => {
    if (!session?.user?.id) return;
    if (!title.trim()) {
      Alert.alert('Titre requis');
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      is_public: isPublic,
      created_by: session.user.id,
    };

    let programId = isNew ? null : (id as string);

    if (isNew) {
      const { data, error } = await supabase.from('programs').insert(payload).select('id').single();
      if (error) {
        setSaving(false);
        Alert.alert('Erreur', error.message);
        return;
      }
      programId = data.id;
    } else {
      const { error } = await supabase.from('programs').update(payload).eq('id', id);
      if (error) {
        setSaving(false);
        Alert.alert('Erreur', error.message);
        return;
      }
    }

    if (programId) {
      await supabase.from('program_pathologies').delete().eq('program_id', programId);
      if (pathologies.length) {
        const { data: pathRows } = await supabase
          .from('pathologies')
          .select('id, code')
          .in('code', pathologies);
        const rows = (pathRows ?? []).map((p) => ({
          program_id: programId,
          pathology_id: p.id,
        }));
        if (rows.length) await supabase.from('program_pathologies').insert(rows);
      }
    }

    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['programs'] });
    if (isNew && programId) router.replace(`/(kine)/programs/${programId}` as never);
    else Alert.alert('Enregistré');
  };

  const addExercise = async (exerciseId: string) => {
    if (!id || id === 'new') {
      Alert.alert('Enregistrez d\'abord le programme.');
      return;
    }
    const order = items.length;
    const { error } = await supabase.from('program_exercises').insert({
      program_id: id,
      exercise_id: exerciseId,
      order,
    });
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    await reloadItems(id as string);
    setShowPicker(false);
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('program_exercises').delete().eq('id', itemId);
    const next = items.filter((i) => i.id !== itemId).map((it, idx) => ({ ...it, order: idx }));
    // Renumérote les ordres en DB pour rester compact.
    for (const it of next) {
      await supabase.from('program_exercises').update({ order: it.order }).eq('id', it.id);
    }
    setItems(next);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    const next = [...items];
    next[index] = { ...b, order: index };
    next[target] = { ...a, order: target };
    setItems(next);
    // Astuce: on passe par des ordres temporaires negatifs pour eviter de violer
    // la contrainte unique (program_id, exercise_id, order) pendant le swap.
    await supabase.from('program_exercises').update({ order: -1 }).eq('id', a.id);
    await supabase.from('program_exercises').update({ order: target }).eq('id', b.id);
    await supabase.from('program_exercises').update({ order: index }).eq('id', a.id);
    // On recharge pour re-synchroniser la relation exercises.
    if (typeof id === 'string') await reloadItems(id);
  };

  const availableExercises = useMemo(
    () => (myExercises ?? []).filter((ex) => !items.some((it) => it.exercise_id === ex.id)),
    [myExercises, items],
  );

  if (loading) {
    return (
      <Screen>
        <Text style={styles.muted}>Chargement…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{isNew ? 'Nouveau programme' : 'Modifier le programme'}</Text>

      <TextField label="Titre" value={title} onChangeText={setTitle} placeholder="Ex : PSH quotidien" />
      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Text style={styles.section}>Pathologies ciblées</Text>
      <PathologyPicker selected={pathologies} onChange={setPathologies} />

      <View style={styles.switchRow}>
        <Text style={styles.body}>Visible par tous les patients</Text>
        <Switch value={isPublic} onValueChange={setIsPublic} />
      </View>

      <Button label="Enregistrer le programme" onPress={saveProgram} loading={saving} />

      {isNew ? (
        <Text style={styles.hint}>
          Enregistrez le programme pour pouvoir y ajouter des exercices.
        </Text>
      ) : (
        <>
          <Text style={styles.section}>Exercices du programme</Text>
          {items.length === 0 ? (
            <Text style={styles.muted}>
              Aucun exercice pour l'instant. Utilisez le bouton ci-dessous pour
              piocher parmi vos exercices encodés.
            </Text>
          ) : null}

          {items.map((item, idx) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {idx + 1}. {item.exercises.title}
                </Text>
                <Text style={styles.meta}>{exerciseSummary(item.exercises)}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  onPress={() => move(idx, -1)}
                  disabled={idx === 0}
                  style={[styles.moveBtn, idx === 0 && styles.moveBtnDisabled]}
                >
                  <Text style={styles.moveBtnLabel}>↑</Text>
                </Pressable>
                <Pressable
                  onPress={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  style={[styles.moveBtn, idx === items.length - 1 && styles.moveBtnDisabled]}
                >
                  <Text style={styles.moveBtnLabel}>↓</Text>
                </Pressable>
                <Pressable onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeLabel}>Retirer</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Button
            label={showPicker ? 'Fermer la liste' : '+ Ajouter un exercice au programme'}
            variant="secondary"
            onPress={() => setShowPicker((v) => !v)}
          />

          {showPicker ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {availableExercises.length === 0 ? (
                <Text style={styles.muted}>
                  Tous vos exercices sont déjà dans ce programme, ou vous n'avez
                  pas encore créé d'exercice.
                </Text>
              ) : (
                availableExercises.map((ex) => (
                  <Pressable key={ex.id} style={styles.pickerCard} onPress={() => addExercise(ex.id)}>
                    <Text style={styles.cardTitle}>{ex.title}</Text>
                    <Text style={styles.meta}>{exerciseSummary(ex)}</Text>
                    <Text style={styles.addHint}>Appuyer pour ajouter</Text>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  body: { ...typography.body, color: colors.text },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerCard: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  addHint: { ...typography.small, color: colors.primary, marginTop: spacing.xs },
  muted: { ...typography.body, color: colors.textMuted },
  hint: { ...typography.small, color: colors.textMuted, fontStyle: 'italic' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  moveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveBtnDisabled: { opacity: 0.3 },
  moveBtnLabel: { ...typography.body, color: colors.text, fontWeight: '700' },
  removeLabel: { ...typography.small, color: colors.danger },
});
