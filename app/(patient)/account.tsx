import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/lib/theme';

export default function AccountScreen() {
  const { profile, session, refreshProfile, signOut } = useAuth();
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ interests })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) Alert.alert('Erreur', error.message);
    else {
      await refreshProfile();
      Alert.alert('Préférences enregistrées');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Mon compte</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session?.user?.email}</Text>
        <Text style={styles.label}>Rôle</Text>
        <Text style={styles.value}>{profile?.role}</Text>
      </View>

      <Text style={styles.section}>Pathologies d'intérêt</Text>
      <PathologyPicker selected={interests} onChange={setInterests} />
      <Button label="Enregistrer" onPress={save} loading={saving} />

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
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
});
