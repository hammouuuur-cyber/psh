import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveInvitationCodes, useLinkedPatients } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

export default function PatientsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const kineId = session?.user?.id;

  const { data: patients } = useLinkedPatients(kineId);
  const { data: codes } = useActiveInvitationCodes(kineId);
  const [generating, setGenerating] = useState(false);

  const generateCode = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc('generate_invitation_code');
    setGenerating(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    queryClient.invalidateQueries({ queryKey: ['invitation_codes', kineId] });

    Alert.alert(
      'Code d\'invitation généré 🎉',
      `Votre code est :\n\n${data}\n\nPartagez-le avec votre patient. Il est valable 7 jours.`,
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Partager',
          onPress: () =>
            Share.share({
              message: `Bonjour, voici votre code pour vous lier à mon espace PSH Kiné :\n\n${data}\n\nTéléchargez l'app, allez dans Mon compte → « Lier à mon kiné » et saisissez ce code. Valable 7 jours.`,
            }).catch(() => {}),
        },
      ],
    );
  };

  const unlink = (linkId: string, patientName: string) => {
    Alert.alert(
      'Retirer ce patient ?',
      `Le lien avec ${patientName} sera supprimé. Vous pourrez le recréer plus tard avec un nouveau code.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('care_links').delete().eq('id', linkId);
            if (error) Alert.alert('Erreur', error.message);
            else {
              queryClient.invalidateQueries({ queryKey: ['care_links', 'kine', kineId] });
              queryClient.invalidateQueries({ queryKey: ['conversations', kineId] });
            }
          },
        },
      ],
    );
  };

  const revokeCode = async (code: string) => {
    const { error } = await supabase.from('invitation_codes').delete().eq('code', code);
    if (error) Alert.alert('Erreur', error.message);
    else queryClient.invalidateQueries({ queryKey: ['invitation_codes', kineId] });
  };

  const shareCode = (code: string) => {
    Share.share({
      message: `Voici votre code pour vous lier à mon espace PSH Kiné :\n\n${code}\n\nTéléchargez l'app, allez dans Mon compte → « Lier à mon kiné » et saisissez ce code. Valable 7 jours.`,
    }).catch(() => {});
  };

  return (
    <Screen>
      <Text style={styles.title}>Mes patients</Text>

      <Button
        label="Inviter un patient"
        onPress={generateCode}
        loading={generating}
      />

      {/* Codes actifs non utilisés */}
      {codes && codes.length > 0 ? (
        <>
          <Text style={styles.section}>Invitations en attente ({codes.length})</Text>
          {codes.map((c) => (
            <View key={c.code} style={styles.codeCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>{c.code}</Text>
                <Text style={styles.codeExpiry}>Expire le {formatDate(c.expires_at)}</Text>
              </View>
              <Pressable onPress={() => shareCode(c.code)} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => revokeCode(c.code)} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </>
      ) : null}

      {/* Liste des patients liés */}
      <Text style={styles.section}>
        Patients liés {patients && patients.length > 0 ? `(${patients.length})` : ''}
      </Text>

      {!patients || patients.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.muted}>
            Aucun patient lié pour l'instant.{'\n'}Générez un code et partagez-le.
          </Text>
        </View>
      ) : (
        patients.map((p) => {
          const name = p.patient?.display_name ?? 'Patient';
          return (
            <Pressable
              key={p.id}
              style={({ pressed }) => [styles.patientCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(`/(kine)/patients/${p.id}` as never)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{name}</Text>
                <Text style={styles.patientHint}>Lié depuis le {formatDate(p.created_at)}</Text>
              </View>
              <Pressable onPress={() => unlink(p.id, name)} hitSlop={8} style={styles.iconBtn}>
                <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  muted: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  codeCard: {
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
  code: {
    ...typography.h2,
    color: colors.accent,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  codeExpiry: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  iconBtn: { padding: 4 },

  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },

  patientCard: {
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
  avatarText: { ...typography.h3, color: colors.primary },
  patientName: { ...typography.bodyStrong, color: colors.text },
  patientHint: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
