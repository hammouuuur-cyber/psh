import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { GoalsPicker } from '@/components/GoalsPicker';
import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

export default function AccountScreen() {
  const { profile, session, refreshProfile, signOut } = useAuth();
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [goals, setGoals] = useState<string[]>(profile?.goals ?? []);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ interests, goals })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) Alert.alert('Erreur', error.message);
    else {
      await refreshProfile();
      Alert.alert('Préférences enregistrées ✔');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Mon compte</Text>

      {/* Info utilisateur */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Email</Text>
        <Text style={styles.cardValue}>{session?.user?.email}</Text>
        {profile?.display_name ? (
          <>
            <Text style={styles.cardLabel}>Prénom</Text>
            <Text style={styles.cardValue}>{profile.display_name}</Text>
          </>
        ) : null}
        <Text style={styles.cardLabel}>Rôle</Text>
        <Text style={styles.cardValue}>
          {profile?.role === 'patient' ? 'Patient' : 'Kinésithérapeute'}
        </Text>
      </View>

      {/* Pathologies */}
      <Text style={styles.section}>Mes pathologies</Text>
      <Text style={styles.sectionDesc}>
        Les programmes et exercices recommandés sont filtrés selon ces pathologies.
      </Text>
      <PathologyPicker selected={interests} onChange={setInterests} />

      {/* Objectifs */}
      <Text style={styles.section}>Mes objectifs</Text>
      <Text style={styles.sectionDesc}>
        Vos priorités thérapeutiques du moment.
      </Text>
      <GoalsPicker selected={goals} onChange={setGoals} />

      <Button label="Enregistrer les préférences" onPress={save} loading={saving} />

      <View style={{ height: spacing.xl }} />
      <Button label="Se déconnecter" variant="danger" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: 2,
    ...elevation(1),
  },
  cardLabel: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },
  cardValue: { ...typography.bodyStrong, color: colors.text },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  sectionDesc: { ...typography.small, color: colors.textMuted },
});
