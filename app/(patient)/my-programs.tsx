import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useSubscribedPrograms } from '@/lib/queries';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function MyProgramsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useSubscribedPrograms(session?.user?.id);

  return (
    <Screen>
      <Text style={styles.title}>Mes programmes</Text>
      <Text style={styles.subtitle}>
        Programmes auxquels vous vous êtes abonné. Ouvrez-en un pour accéder aux exercices.
      </Text>

      {isLoading ? <Text style={styles.muted}>Chargement…</Text> : null}
      {data && data.length === 0 ? (
        <Text style={styles.muted}>
          Vous n'êtes abonné à aucun programme pour le moment. Explorez l'accueil pour en trouver.
        </Text>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        {data?.map((p) => (
          <Pressable
            key={p.id}
            style={styles.card}
            onPress={() => router.push(`/(patient)/program/${p.id}` as never)}
          >
            <Text style={styles.cardTitle}>{p.title}</Text>
            {p.description ? <Text style={styles.cardDesc}>{p.description}</Text> : null}
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
  cardDesc: { ...typography.small, color: colors.textMuted },
});
