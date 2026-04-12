import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { usePublicExercises } from '@/lib/queries';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function CatalogScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<string[]>(profile?.interests ?? []);
  const { data, isLoading } = usePublicExercises(filter.length ? filter : undefined);

  return (
    <Screen>
      <Text style={styles.title}>Catalogue d'exercices</Text>
      <Text style={styles.subtitle}>Filtrer par pathologie</Text>
      <PathologyPicker selected={filter} onChange={setFilter} />

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {isLoading ? <Text style={styles.muted}>Chargement…</Text> : null}
        {data && data.length === 0 ? (
          <Text style={styles.muted}>Aucun exercice trouvé pour ces filtres.</Text>
        ) : null}
        {data?.map((ex) => (
          <Pressable
            key={ex.id}
            style={styles.card}
            onPress={() => router.push(`/(patient)/exercise/${ex.id}` as never)}
          >
            <Text style={styles.cardTitle}>{ex.title}</Text>
            {ex.description ? <Text style={styles.cardDesc} numberOfLines={2}>{ex.description}</Text> : null}
            <Text style={styles.meta}>
              {ex.default_sets ?? 3} séries ·{' '}
              {ex.default_duration_sec
                ? `${ex.default_duration_sec}s`
                : `${ex.default_reps ?? '?'} reps`}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: 4,
  },
  cardTitle: { ...typography.h3, color: colors.text },
  cardDesc: { ...typography.small, color: colors.textMuted },
  meta: { ...typography.small, color: colors.primary, marginTop: 4 },
});
