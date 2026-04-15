import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { GoalsPicker } from '@/components/GoalsPicker';
import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth();
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!session?.user?.id) return;
    if (interests.length === 0) {
      Alert.alert(
        'Sélectionnez une pathologie',
        'Cela nous permet d\'adapter les recommandations.',
      );
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ interests, goals })
      .eq('id', session.user.id);
    setSaving(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    await refreshProfile();
    router.replace('/(patient)');
  };

  return (
    <Screen>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🌿</Text>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>
          Quelques infos pour personnaliser votre espace. Vous pourrez les modifier à tout moment.
        </Text>
      </View>

      {/* Pathologies */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ma pathologie</Text>
          <Text style={styles.sectionHint}>Obligatoire</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Sélectionnez une ou plusieurs pathologies qui vous concernent.
        </Text>
        <PathologyPicker selected={interests} onChange={setInterests} />
      </View>

      {/* Objectifs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes objectifs</Text>
          <Text style={styles.sectionHintOptional}>Optionnel</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Qu'est-ce qui vous tient le plus à cœur ? Cela aide à orienter les exercices.
        </Text>
        <GoalsPicker selected={goals} onChange={setGoals} />
      </View>

      <Button label="Commencer" onPress={save} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emoji: { fontSize: 52 },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionDesc: { ...typography.small, color: colors.textMuted },
  sectionHint: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: `${colors.accent}18`,
    borderRadius: 999,
  },
  sectionHintOptional: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
  },
});
