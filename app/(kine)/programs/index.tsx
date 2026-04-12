import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useMyPrograms } from '@/lib/queries';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function KineProgramsList() {
  const { session } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useMyPrograms(session?.user?.id);

  return (
    <Screen>
      <Text style={styles.title}>Mes programmes</Text>
      <Text style={styles.subtitle}>
        Regroupez des exercices en programmes que vos patients peuvent consulter.
      </Text>

      <Button label="+ Nouveau programme" onPress={() => router.push('/(kine)/programs/new' as never)} />

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {isLoading ? <Text style={styles.muted}>Chargement…</Text> : null}
        {data && data.length === 0 ? (
          <Text style={styles.muted}>Aucun programme pour l'instant.</Text>
        ) : null}
        {data?.map((p) => (
          <Pressable
            key={p.id}
            style={styles.card}
            onPress={() => router.push(`/(kine)/programs/${p.id}` as never)}
          >
            <Text style={styles.cardTitle}>{p.title}</Text>
            <Text style={styles.meta}>{p.is_public ? '🌐 Public' : '🔒 Privé'}</Text>
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
