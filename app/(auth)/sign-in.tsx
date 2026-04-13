import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/lib/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Merci de renseigner email et mot de passe.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Connexion impossible', error.message);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>PSH Kiné</Text>
        <Text style={styles.subtitle}>
          Exercices adaptés aux maladies neuromusculaires
        </Text>
      </View>

      <View style={styles.card}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="vous@exemple.com"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholder="••••••••"
        />
        <Button label="Se connecter" onPress={onSubmit} loading={loading} />

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Pas encore de compte ?</Text>
        <Link href="/(auth)/sign-up">
          <Text style={styles.signupLink}> Créer un compte</Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
  },
  title: { ...typography.h1, color: colors.text, marginTop: spacing.sm },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 0,
  },
  forgotWrap: { alignItems: 'flex-end', paddingTop: spacing.sm },
  forgotText: { ...typography.small, color: colors.primary, fontWeight: '600' },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: spacing.md,
    flexWrap: 'wrap',
  },
  signupText: { ...typography.body, color: colors.textMuted },
  signupLink: { ...typography.bodyStrong, color: colors.primary },
});
