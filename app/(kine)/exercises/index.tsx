import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useMyExercises } from '@/lib/queries';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function KineExercisesList() {
  const { session } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useMyExercises(session?.user?.id);

  return (
    <Screen>
      <Text style={styles.title}>Mes exercices</Text>
      <Text style={styles.subtitle}>
        Créez des exercices réutilisables, puis regroupez-les en programmes.
      </Text>

      <Button
        label="+ Nouvel exercice"
        onPress={() => router.push('/(kine)/exercises/new' as never)}
      />

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {isLoading ? <Text style={styles.muted}>Chargement…</Text> : null}
        {data && data.length === 0 ? (
          <Text style={styles.muted}>Aucun exercice. Commencez par en créer un.</Text>
        ) : null}
        {data?.map((ex) => (
          <Pressable
            key={ex.id}
            style={styles.card}
            onPress={() => router.push(`/(kine)/exercises/${ex.id}` as never)}
          >
            <Text style={styles.cardTitle}>{ex.title}</Text>
            <Text style={styles.meta}>
              {ex.is_public ? '🌐 Public' : '🔒 Privé'} · {ex.default_sets ?? 3} séries ·{' '}
              {ex.default_duration_sec ? `${ex.default_duration_sec}s` : `${ex.default_reps ?? '?'} reps`}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted },
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.md, gap: 4 },
  cardTitle: { ...typography.h3, color: colors.text },
  meta: { ...typography.small, color: colors.primary },
});
