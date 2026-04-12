import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { Role } from '@/types/database';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Email et mot de passe nécessaires.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Minimum 8 caractères.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert('Inscription impossible', error.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      // Création du profil avec rôle choisi
      const { error: pErr } = await supabase.from('profiles').upsert({
        id: userId,
        role,
        display_name: name || null,
        interests: [],
      });
      if (pErr) {
        console.warn('[sign-up] profile insert error', pErr.message);
      }
    }

    setLoading(false);

    if (!data.session) {
      Alert.alert(
        'Confirmation requise',
        'Vérifiez votre email pour confirmer votre inscription, puis reconnectez-vous.',
      );
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Créer un compte</Text>

      <Text style={styles.sectionLabel}>Je suis :</Text>
      <View style={styles.rolesRow}>
        {(['patient', 'kine'] as Role[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={[styles.roleCard, role === r && styles.roleCardActive]}
          >
            <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>
              {r === 'patient' ? 'Patient' : 'Kinésithérapeute'}
            </Text>
            <Text style={[styles.roleHint, role === r && styles.roleHintActive]}>
              {r === 'patient'
                ? 'Consulter des exercices adaptés à ma pathologie'
                : 'Créer des exercices et programmes pour mes patients'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextField label="Nom (optionnel)" value={name} onChangeText={setName} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        label="Mot de passe (8 caractères min.)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button label="Créer mon compte" onPress={onSubmit} loading={loading} />

      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Link href="/(auth)/sign-in">
          <Text style={{ color: colors.primary, ...typography.body }}>J'ai déjà un compte</Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.md },
  sectionLabel: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  rolesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  roleLabel: { ...typography.h3, color: colors.text },
  roleLabelActive: { color: colors.primary },
  roleHint: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  roleHintActive: { color: colors.text },
});
