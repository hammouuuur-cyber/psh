import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { GoalsPicker } from '@/components/GoalsPicker';
import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useLinkedKines } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

export default function AccountScreen() {
  const { profile, session, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [goals, setGoals] = useState<string[]>(profile?.goals ?? []);
  const [saving, setSaving] = useState(false);

  const { data: kines } = useLinkedKines(session?.user?.id);
  const kineCount = kines?.length ?? 0;

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

      {/* Lien avec mon kiné */}
      <Pressable
        style={({ pressed }) => [styles.linkCard, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/(patient)/link-kine' as never)}
      >
        <View style={styles.linkIcon}>
          <Ionicons name="medkit" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Mon kinésithérapeute</Text>
          <Text style={styles.linkHint}>
            {kineCount === 0
              ? 'Aucun kiné lié — saisir un code d\'invitation'
              : kineCount === 1
                ? `1 kiné lié — ${kines?.[0]?.kine?.display_name ?? ''}`
                : `${kineCount} kinés liés`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

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

  linkCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...elevation(1),
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  linkTitle: { ...typography.bodyStrong, color: colors.text },
  linkHint: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
