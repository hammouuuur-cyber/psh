import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { ExerciseTimer } from '@/components/ExerciseTimer';
import { Screen } from '@/components/Screen';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useExerciseDetail } from '@/lib/queries';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useExerciseDetail(id);
  const [session, setSession] = useState(false);

  if (isLoading || !data?.exercise) {
    return (
      <Screen>
        <Text style={styles.muted}>Chargement…</Text>
      </Screen>
    );
  }

  const { exercise, assets } = data;
  const video = assets.find((a) => a.kind === 'video');

  return (
    <Screen>
      <Text style={styles.title}>{exercise.title}</Text>

      {video ? <VideoPlayer storagePath={video.storage_path} /> : null}

      {exercise.description ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <Text style={styles.body}>{exercise.description}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paramètres</Text>
        <Text style={styles.body}>Séries : {exercise.default_sets ?? 3}</Text>
        {exercise.default_duration_sec ? (
          <Text style={styles.body}>Durée par série : {exercise.default_duration_sec}s</Text>
        ) : (
          <Text style={styles.body}>Répétitions : {exercise.default_reps ?? '?'}</Text>
        )}
        <Text style={styles.body}>Repos : {exercise.default_rest_sec ?? 15}s</Text>
      </View>

      {!session ? (
        <Button label="Commencer la séance" onPress={() => setSession(true)} />
      ) : (
        <ExerciseTimer
          sets={exercise.default_sets ?? 3}
          reps={exercise.default_reps}
          durationSec={exercise.default_duration_sec}
          restSec={exercise.default_rest_sec}
          onComplete={() => {
            /* Pas de suivi en MVP */
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: 4,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: 4 },
  body: { ...typography.body, color: colors.textMuted },
  muted: { ...typography.body, color: colors.textMuted },
});
