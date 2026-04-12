import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/lib/theme';

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Connexion impossible', error.message);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>
        Votre application d'exercices de kinésithérapie pour maladies neuromusculaires.
      </Text>

      <View style={{ marginTop: 24 }}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        <Button label="Se connecter" onPress={onSubmit} loading={loading} />
      </View>

      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Link href="/(auth)/sign-up">
          <Text style={{ color: colors.primary, ...typography.body }}>Créer un compte</Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 8 },
});
