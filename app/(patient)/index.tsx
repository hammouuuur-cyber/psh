import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { usePublicPrograms } from '@/lib/queries';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function PatientHome() {
  const { profile } = useAuth();
  const router = useRouter();
  const interests = profile?.interests ?? [];
  const { data: programs, isLoading } = usePublicPrograms(interests.length ? interests : undefined);

  return (
    <Screen>
      <Text style={styles.greeting}>
        Bonjour{profile?.display_name ? ` ${profile.display_name}` : ''} 👋
      </Text>
      <Text style={styles.subtitle}>
        {interests.length
          ? `Programmes recommandés pour : ${interests.join(', ')}`
          : 'Programmes disponibles'}
      </Text>

      {isLoading ? <Text style={styles.muted}>Chargement…</Text> : null}

      {programs && programs.length === 0 ? (
        <Text style={styles.muted}>
          Aucun programme public pour l'instant. Demandez à votre kiné d'en créer un, ou explorez le
          catalogue d'exercices.
        </Text>
      ) : null}

      {programs?.map((p) => (
        <Pressable
          key={p.id}
          style={styles.card}
          onPress={() => router.push(`/(patient)/program/${p.id}` as never)}
        >
          <Text style={styles.cardTitle}>{p.title}</Text>
          {p.description ? <Text style={styles.cardDesc}>{p.description}</Text> : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  cardTitle: { ...typography.h3, color: colors.text },
  cardDesc: { ...typography.small, color: colors.textMuted },
});
