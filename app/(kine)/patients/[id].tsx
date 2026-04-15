import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useLatestSessionForPatient } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';
import type { CareLink, Profile } from '@/types/database';

export default function PatientDetailScreen() {
  // id = care_link_id
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const kineId = session?.user?.id;

  const { data: link, isLoading } = useQuery({
    enabled: !!id && !!kineId,
    queryKey: ['care_link', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('care_links')
        .select(
          'id, status, created_at, kine_id, patient_id, patient:profiles!care_links_patient_id_fkey(id, display_name, role)',
        )
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as
        | (CareLink & { patient: Pick<Profile, 'id' | 'display_name' | 'role'> | null })
        | null;
    },
  });

  const patientId = link?.patient_id;
  const { data: latest } = useLatestSessionForPatient(patientId);

  // Historique récent (10 dernières séances tous programmes confondus)
  const { data: history } = useQuery({
    enabled: !!patientId,
    queryKey: ['patient_history', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_sessions')
        .select('id, completed_at, perceived_effort, feedback_note, programs(title)')
        .eq('patient_id', patientId!)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        completed_at: string;
        perceived_effort: number | null;
        feedback_note: string | null;
        programs: { title: string } | null;
      }>;
    },
  });

  if (isLoading || !link) {
    return (
      <Screen>
        <Text style={styles.muted}>Chargement…</Text>
      </Screen>
    );
  }

  const name = link.patient?.display_name ?? 'Patient';

  return (
    <Screen>
      {/* En-tête patient */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.hint}>Lié depuis le {formatDate(link.created_at)}</Text>
        </View>
      </View>

      {/* Bouton messagerie */}
      <Button
        label="Envoyer un message"
        onPress={() => router.push(`/(kine)/messages/${link.id}` as never)}
      />

      {/* Dernière séance */}
      <Text style={styles.section}>Dernière séance</Text>
      {latest ? (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.cardTitle}>{latest.programs?.title ?? 'Programme'}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {latest.completed_at ? formatDateTime(latest.completed_at) : ''}
          </Text>
          {latest.perceived_effort ? (
            <Text style={styles.cardLine}>Effort ressenti : {latest.perceived_effort} / 5</Text>
          ) : null}
          {latest.feedback_note ? (
            <Text style={styles.cardNote}>« {latest.feedback_note} »</Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.muted}>Aucune séance terminée pour l'instant.</Text>
      )}

      {/* Historique */}
      {history && history.length > 1 ? (
        <>
          <Text style={styles.section}>Historique récent</Text>
          {history.slice(1).map((s) => (
            <View key={s.id} style={styles.historyRow}>
              <Ionicons name="ellipse" size={8} color={colors.primary} />
              <Text style={styles.historyDate}>
                {s.completed_at ? formatDate(s.completed_at) : ''} —{' '}
                {s.programs?.title ?? 'Programme'}
              </Text>
              {s.perceived_effort ? (
                <Text style={styles.historyEffort}>effort {s.perceived_effort}/5</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: { ...typography.h1, color: colors.primary },
  name: { ...typography.h1, color: colors.text },
  hint: { ...typography.small, color: colors.textMuted, marginTop: 2 },

  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  muted: { ...typography.body, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    ...elevation(1),
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { ...typography.bodyStrong, color: colors.text },
  cardSubtitle: { ...typography.small, color: colors.textMuted },
  cardLine: { ...typography.body, color: colors.text, marginTop: 4 },
  cardNote: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  historyDate: { ...typography.body, color: colors.text, flex: 1 },
  historyEffort: { ...typography.small, color: colors.textMuted },
});
