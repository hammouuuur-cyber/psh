import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/lib/theme';

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!session?.user?.id) return;
    if (selected.length === 0) {
      Alert.alert('Sélectionnez au moins une pathologie', 'Cela nous permet d\'adapter les recommandations.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ interests: selected })
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
      <Text style={styles.title}>Vos pathologies</Text>
      <Text style={styles.subtitle}>
        Sélectionnez une ou plusieurs pathologies qui vous concernent. Nous vous recommanderons des
        exercices et programmes adaptés.
      </Text>

      <PathologyPicker selected={selected} onChange={setSelected} />

      <Button label="Continuer" onPress={save} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: 8 },
});
