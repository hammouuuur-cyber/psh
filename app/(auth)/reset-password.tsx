import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/lib/theme';

/**
 * Écran cible du deep link `pshkine://reset-password?access_token=...&refresh_token=...&type=recovery`.
 * Le routing racine (app/_layout.tsx) normalise le fragment `#` en query string et
 * dépose la session via `supabase.auth.setSession` avant d'atterrir ici.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else if (params.status === 'invalid') {
        setError('Le lien de réinitialisation est invalide ou a expiré.');
      } else {
        setError(
          'Impossible de récupérer votre session de récupération. Ouvrez à nouveau le lien depuis votre email.',
        );
      }
    })();
  }, [params.status]);

  const onSubmit = async () => {
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Minimum 8 caractères.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Confirmation', 'Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updErr) {
      Alert.alert('Erreur', updErr.message);
      return;
    }
    Alert.alert('Mot de passe mis à jour', 'Vous pouvez maintenant utiliser votre nouveau mot de passe.');
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Nouveau mot de passe</Text>
        {error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <Button label="Retour" variant="secondary" onPress={() => router.replace('/(auth)/sign-in')} />
          </>
        ) : !ready ? (
          <Text style={styles.body}>Vérification du lien…</Text>
        ) : (
          <>
            <Text style={styles.body}>
              Choisissez un nouveau mot de passe d'au moins 8 caractères.
            </Text>
            <TextField
              label="Nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <TextField
              label="Confirmer le mot de passe"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="••••••••"
            />
            <Button label="Mettre à jour" onPress={onSubmit} loading={loading} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },
  body: { ...typography.body, color: colors.textMuted },
  errorText: { ...typography.body, color: colors.danger },
});
