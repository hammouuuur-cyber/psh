import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, typography } from '@/lib/theme';

export default function KineAccount() {
  const { profile, session, signOut } = useAuth();
  return (
    <Screen>
      <Text style={styles.title}>Mon compte kiné</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session?.user?.email}</Text>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{profile?.display_name ?? '—'}</Text>
      </View>
      <View style={{ height: spacing.xl }} />
      <Button label="Se déconnecter" variant="danger" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 12, gap: 4 },
  label: { ...typography.small, color: colors.textMuted },
  value: { ...typography.body, color: colors.text, marginBottom: spacing.sm },
});
