import { useEffect, useState } from 'react';
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

      const { data: pe } = await supabase
        .from('program_exercises')
        .select('*, exercises(*)')
        .eq('program_id', id)
        .order('order');
      setItems((pe ?? []) as ProgramItem[]);

      setLoading(false);
    })();
  }, [id, isNew]);

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
    const { data } = await supabase
      .from('program_exercises')
      .select('*, exercises(*)')
      .eq('program_id', id)
      .order('order');
    setItems((data ?? []) as ProgramItem[]);
    setShowPicker(false);
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('program_exercises').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

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

      {!isNew ? (
        <>
          <Text style={styles.section}>Exercices du programme</Text>
          {items.length === 0 ? (
            <Text style={styles.muted}>Aucun exercice. Ajoutez-en depuis vos exercices.</Text>
          ) : null}
          {items.map((item, idx) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {idx + 1}. {item.exercises.title}
              </Text>
              <Pressable onPress={() => removeItem(item.id)}>
                <Text style={{ color: colors.danger }}>Retirer</Text>
              </Pressable>
            </View>
          ))}

          <Button
            label={showPicker ? 'Fermer' : '+ Ajouter un exercice'}
            variant="secondary"
            onPress={() => setShowPicker((v) => !v)}
          />

          {showPicker ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {(myExercises ?? [])
                .filter((ex) => !items.some((it) => it.exercise_id === ex.id))
                .map((ex) => (
                  <Pressable key={ex.id} style={styles.card} onPress={() => addExercise(ex.id)}>
                    <Text style={styles.cardTitle}>{ex.title}</Text>
                    <Text style={styles.meta}>Appuyer pour ajouter</Text>
                  </Pressable>
                ))}
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.hint}>Enregistrez d'abord pour ajouter des exercices.</Text>
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { ...typography.body, color: colors.text, flex: 1 },
  meta: { ...typography.small, color: colors.primary },
  muted: { ...typography.body, color: colors.textMuted },
  hint: { ...typography.small, color: colors.textMuted, fontStyle: 'italic' },
});
