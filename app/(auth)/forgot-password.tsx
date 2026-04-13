import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/lib/theme';

// Cette URL de redirection doit être ajoutée dans Supabase :
// Authentication → URL Configuration → Redirect URLs : `pshkine://reset-password`
const RESET_REDIRECT = 'pshkine://reset-password';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Email requis', 'Merci de renseigner votre email.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: RESET_REDIRECT,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Envoi impossible', error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.title}>Email envoyé ✉️</Text>
          <Text style={styles.body}>
            Si un compte existe pour <Text style={styles.strong}>{email}</Text>,
            un email de réinitialisation vient d'être envoyé. Ouvrez le lien
            depuis votre téléphone pour choisir un nouveau mot de passe.
          </Text>
          <Text style={styles.hint}>
            Le lien ouvre directement l'application PSH Kiné. Pensez à vérifier
            vos spams.
          </Text>
          <Button label="Retour à la connexion" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Réinitialiser le mot de passe</Text>
        <Text style={styles.body}>
          Indiquez l'email de votre compte. Nous vous envoyons un lien sécurisé
          pour choisir un nouveau mot de passe.
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="vous@exemple.com"
        />

        <Button label="Envoyer le lien" onPress={onSubmit} loading={loading} />
        <Button label="Annuler" variant="ghost" onPress={() => router.back()} />
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
  strong: { color: colors.text, fontWeight: '600' },
  hint: { ...typography.small, color: colors.textMuted, fontStyle: 'italic' },
});
