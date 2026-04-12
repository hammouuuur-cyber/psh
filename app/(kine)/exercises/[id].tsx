import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { UploadMedia } from '@/components/UploadMedia';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { ExerciseAsset } from '@/types/database';

/**
 * Route : /(kine)/exercises/[id]
 * - `id` = "new" pour créer un nouvel exercice
 * - sinon = uuid pour éditer un exercice existant
 */
export default function KineExerciseEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('');
  const [durationSec, setDurationSec] = useState('');
  const [restSec, setRestSec] = useState('15');
  const [pathologies, setPathologies] = useState<string[]>([]);
  const [assets, setAssets] = useState<ExerciseAsset[]>([]);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data: ex } = await supabase.from('exercises').select('*').eq('id', id).maybeSingle();
      if (ex) {
        setTitle(ex.title);
        setDescription(ex.description ?? '');
        setIsPublic(ex.is_public);
        setSets(String(ex.default_sets ?? 3));
        setReps(ex.default_reps != null ? String(ex.default_reps) : '');
        setDurationSec(ex.default_duration_sec != null ? String(ex.default_duration_sec) : '');
        setRestSec(String(ex.default_rest_sec ?? 15));
      }

      const { data: xp } = await supabase
        .from('exercise_pathologies')
        .select('pathologies(code)')
        .eq('exercise_id', id);
      setPathologies(
        ((xp ?? []) as { pathologies: { code: string } | null }[])
          .map((r) => r.pathologies?.code)
          .filter((c): c is string => !!c),
      );

      const { data: a } = await supabase
        .from('exercise_assets')
        .select('*')
        .eq('exercise_id', id)
        .order('order');
      setAssets((a ?? []) as ExerciseAsset[]);

      setLoading(false);
    })();
  }, [id, isNew]);

  const save = async () => {
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
      default_sets: Number(sets) || null,
      default_reps: reps ? Number(reps) : null,
      default_duration_sec: durationSec ? Number(durationSec) : null,
      default_rest_sec: restSec ? Number(restSec) : 15,
      created_by: session.user.id,
    };

    let exerciseId = isNew ? null : (id as string);

    if (isNew) {
      const { data, error } = await supabase.from('exercises').insert(payload).select('id').single();
      if (error) {
        setSaving(false);
        Alert.alert('Erreur', error.message);
        return;
      }
      exerciseId = data.id;
    } else {
      const { error } = await supabase.from('exercises').update(payload).eq('id', id);
      if (error) {
        setSaving(false);
        Alert.alert('Erreur', error.message);
        return;
      }
    }

    // Syncer les pathologies : supprimer + réinsérer (simple et robuste)
    if (exerciseId) {
      await supabase.from('exercise_pathologies').delete().eq('exercise_id', exerciseId);
      if (pathologies.length > 0) {
        const { data: pathRows } = await supabase
          .from('pathologies')
          .select('id, code')
          .in('code', pathologies);
        const rows = (pathRows ?? []).map((p) => ({
          exercise_id: exerciseId,
          pathology_id: p.id,
        }));
        if (rows.length) await supabase.from('exercise_pathologies').insert(rows);
      }
    }

    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['exercises'] });

    if (isNew && exerciseId) {
      router.replace(`/(kine)/exercises/${exerciseId}` as never);
    } else {
      Alert.alert('Enregistré');
    }
  };

  const onVideoUploaded = async (path: string) => {
    if (!id || id === 'new') return;
    const { error } = await supabase
      .from('exercise_assets')
      .insert({ exercise_id: id, kind: 'video', storage_path: path, order: assets.length });
    if (error) Alert.alert('Erreur', error.message);
    else {
      const { data } = await supabase
        .from('exercise_assets')
        .select('*')
        .eq('exercise_id', id)
        .order('order');
      setAssets((data ?? []) as ExerciseAsset[]);
    }
  };

  const removeAsset = async (assetId: string) => {
    await supabase.from('exercise_assets').delete().eq('id', assetId);
    setAssets((a) => a.filter((x) => x.id !== assetId));
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
      <Text style={styles.title}>{isNew ? 'Nouvel exercice' : 'Modifier l\'exercice'}</Text>

      <TextField label="Titre" value={title} onChangeText={setTitle} placeholder="Ex : Étirement triceps sural" />
      <TextField
        label="Description / consignes"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField label="Séries" value={sets} onChangeText={setSets} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Répétitions" value={reps} onChangeText={setReps} keyboardType="number-pad" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Durée/série (s)"
            value={durationSec}
            onChangeText={setDurationSec}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Repos (s)"
            value={restSec}
            onChangeText={setRestSec}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <Text style={styles.section}>Pathologies concernées</Text>
      <PathologyPicker selected={pathologies} onChange={setPathologies} />

      <View style={styles.switchRow}>
        <Text style={styles.body}>Visible par tous les patients</Text>
        <Switch value={isPublic} onValueChange={setIsPublic} />
      </View>

      <Button label="Enregistrer" onPress={save} loading={saving} />

      {!isNew ? (
        <>
          <Text style={styles.section}>Médias</Text>
          <UploadMedia kind="video" onUploaded={onVideoUploaded} />
          {assets.map((a) => (
            <View key={a.id} style={styles.assetCard}>
              {a.kind === 'video' ? <VideoPlayer storagePath={a.storage_path} /> : null}
              <Pressable onPress={() => removeAsset(a.id)} style={{ marginTop: spacing.sm }}>
                <Text style={{ color: colors.danger }}>Supprimer</Text>
              </Pressable>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.hint}>Enregistrez d'abord l'exercice pour pouvoir ajouter une vidéo.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  body: { ...typography.body, color: colors.text },
  assetCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  hint: { ...typography.small, color: colors.textMuted, fontStyle: 'italic' },
  muted: { ...typography.body, color: colors.textMuted },
});
