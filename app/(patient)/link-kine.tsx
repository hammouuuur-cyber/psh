import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/AuthContext';
import { useLinkedKines } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

export default function LinkKineScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const patientId = session?.user?.id;

  const { data: kines } = useLinkedKines(patientId);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const cleaned = code.trim().toUpperCase().replace(/\s/g, '');
    if (cleaned.length !== 6) {
      Alert.alert('Code invalide', 'Le code doit contenir 6 caractères.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc('redeem_invitation_code', { p_code: cleaned });
    setSubmitting(false);
    if (error) {
      const msg = mapError(error.message);
      Alert.alert('Impossible de se lier', msg);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCode('');
    queryClient.invalidateQueries({ queryKey: ['care_links', 'patient', patientId] });
    queryClient.invalidateQueries({ queryKey: ['conversations', patientId] });
    Alert.alert(
      'C\'est fait ! 🎉',
      'Vous êtes maintenant lié à votre kinésithérapeute. Vous pouvez lui envoyer des messages depuis l\'onglet Messages.',
    );
  };

  const unlink = (linkId: string, kineName: string) => {
    Alert.alert(
      'Retirer ce lien ?',
      `Vous ne serez plus lié à ${kineName}. Vos séances passées restent visibles.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('care_links').delete().eq('id', linkId);
            if (error) Alert.alert('Erreur', error.message);
            else {
              queryClient.invalidateQueries({ queryKey: ['care_links', 'patient', patientId] });
              queryClient.invalidateQueries({ queryKey: ['conversations', patientId] });
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Text style={styles.title}>Mon kinésithérapeute</Text>

      {/* Kinés déjà liés */}
      {kines && kines.length > 0 ? (
        <>
          <Text style={styles.section}>Liens actifs</Text>
          {kines.map((k) => {
            const name = k.kine?.display_name ?? 'Kiné';
            return (
              <View key={k.id} style={styles.kineCard}>
                <View style={styles.avatar}>
                  <Ionicons name="medkit" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kineName}>{name}</Text>
                  <Text style={styles.kineHint}>Lié depuis le {formatDate(k.created_at)}</Text>
                </View>
                <Pressable onPress={() => unlink(k.id, name)} hitSlop={8} style={styles.iconBtn}>
                  <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </>
      ) : null}

      {/* Saisir un code */}
      <Text style={styles.section}>Ajouter un kiné avec un code</Text>
      <Text style={styles.subtitle}>
        Votre kinésithérapeute vous a envoyé un code à 6 caractères. Saisissez-le ci-dessous pour
        vous lier à son espace et pouvoir communiquer avec lui.
      </Text>

      <TextField
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder="A7F3QK"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        style={styles.codeInput}
      />

      <Button
        label="Me lier à mon kiné"
        onPress={submit}
        loading={submitting}
        disabled={code.trim().length < 6}
      />

      <Button label="Retour" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function mapError(message: string): string {
  if (message.includes('invalid_or_expired_code'))
    return 'Ce code est invalide ou expiré. Demandez un nouveau code à votre kiné.';
  if (message.includes('cannot_link_to_self'))
    return 'Vous ne pouvez pas utiliser votre propre code.';
  if (message.includes('not_authenticated')) return 'Session expirée, reconnectez-vous.';
  return message;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },

  codeInput: {
    ...typography.h2,
    letterSpacing: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  kineCard: {
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  kineName: { ...typography.bodyStrong, color: colors.text },
  kineHint: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  iconBtn: { padding: 4 },
});
