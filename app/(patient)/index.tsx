import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { MoodCheckin } from '@/components/MoodCheckin';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import {
  usePublicPrograms,
  useRecentActivity,
  useSubscribedPrograms,
  useTodayCheckin,
} from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';
import type { MoodLevel } from '@/types/database';

export default function PatientHome() {
  const { profile, session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const patientId = session?.user?.id;

  const interests = profile?.interests ?? [];
  const { data: publicPrograms } = usePublicPrograms(interests.length ? interests : undefined);
  const { data: subscribed } = useSubscribedPrograms(patientId);
  const { data: checkin } = useTodayCheckin(patientId);
  const { data: activity } = useRecentActivity(patientId, 14);

  const [saving, setSaving] = useState(false);

  const saveCheckin = async (patch: { mood?: MoodLevel | null; rest_requested?: boolean }) => {
    if (!patientId) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      patient_id: patientId,
      date: today,
      mood: patch.mood ?? checkin?.mood ?? null,
      rest_requested: patch.rest_requested ?? checkin?.rest_requested ?? false,
    };
    const { error } = await supabase
      .from('daily_checkins')
      .upsert(payload, { onConflict: 'patient_id,date' });
    setSaving(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['daily_checkin', 'today', patientId] });
    queryClient.invalidateQueries({ queryKey: ['recent_activity', patientId] });
  };

  const onMood = async (mood: MoodLevel) => {
    await Haptics.selectionAsync();
    saveCheckin({ mood });
  };

  const onListenToBody = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await saveCheckin({ rest_requested: true });
    Alert.alert(
      'Bien joué 🌿',
      "S'écouter, c'est prendre soin de soi. Votre journée est enregistrée comme un jour de repos.",
    );
  };

  // Suggestion : premier programme abonné, ou à défaut le premier programme public.
  const suggested = (subscribed && subscribed[0]) || (publicPrograms && publicPrograms[0]);

  const hourOfDay = new Date().getHours();
  const greeting =
    hourOfDay < 6 ? 'Bonne nuit' : hourOfDay < 12 ? 'Bonjour' : hourOfDay < 18 ? 'Bon après-midi' : 'Bonsoir';
  const name = profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : '';

  return (
    <Screen>
      <Text style={styles.greeting}>
        {greeting}{name} 🌿
      </Text>

      {/* Check-in quotidien */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Aujourd'hui</Text>
        <Text style={styles.cardTitle}>Comment vous sentez-vous ?</Text>
        <MoodCheckin value={(checkin?.mood as MoodLevel | null) ?? null} onChange={onMood} />
        {checkin?.rest_requested ? (
          <View style={styles.restBadge}>
            <Ionicons name="moon" size={14} color={colors.warning} />
            <Text style={styles.restBadgeText}>Jour de repos enregistré</Text>
          </View>
        ) : (
          <Pressable
            onPress={onListenToBody}
            style={({ pressed }) => [styles.listenBtn, pressed && { opacity: 0.8 }]}
            disabled={saving}
          >
            <Ionicons name="leaf" size={18} color={colors.primary} />
            <Text style={styles.listenText}>J'écoute mon corps — repos aujourd'hui</Text>
          </Pressable>
        )}
      </View>

      {/* Jauge de régularité (pas de streak culpabilisant) */}
      {activity && activity.days > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Régularité sur {activity.days} jours</Text>
          <ProgressBar
            value={activity.activeDays}
            max={activity.days}
            showCount
            color={colors.primary}
          />
          <Text style={styles.regularityHint}>
            {activity.activeDays === 0
              ? 'Chaque jour compte. Aucune pression, on avance doucement.'
              : activity.activeDays < activity.days / 3
                ? 'Vous progressez à votre rythme, c\'est ce qui compte.'
                : activity.activeDays < (activity.days * 2) / 3
                  ? 'Belle régularité, continuez comme ça.'
                  : 'Magnifique équilibre, vous prenez soin de vous 💚'}
          </Text>
        </View>
      ) : null}

      {/* Séance du jour */}
      {suggested ? (
        <Pressable
          style={styles.heroCard}
          onPress={() => router.push(`/(patient)/program/${suggested.id}` as never)}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroLabel}>VOTRE SÉANCE</Text>
            <Text style={styles.heroTitle}>{suggested.title}</Text>
            {suggested.description ? (
              <Text style={styles.heroDesc} numberOfLines={2}>
                {suggested.description}
              </Text>
            ) : null}
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Ouvrir</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.text} />
            </View>
          </View>
        </Pressable>
      ) : null}

      {/* Autres programmes */}
      {publicPrograms && publicPrograms.length > 0 ? (
        <>
          <Text style={styles.section}>Programmes recommandés</Text>
          {publicPrograms.slice(0, 5).map((p) => (
            <Pressable
              key={p.id}
              style={styles.programCard}
              onPress={() => router.push(`/(patient)/program/${p.id}` as never)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.programTitle}>{p.title}</Text>
                {p.description ? (
                  <Text style={styles.programDesc} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </>
      ) : null}

      {publicPrograms && publicPrograms.length === 0 && !suggested ? (
        <Text style={styles.muted}>
          Aucun programme public pour l'instant. Demandez à votre kiné d'en créer un, ou explorez le
          catalogue d'exercices.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { ...typography.h1, color: colors.text },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...elevation(1),
  },
  cardLabel: {
    ...typography.overline,
    color: colors.textMuted,
  },
  cardTitle: { ...typography.h3, color: colors.text },

  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    alignSelf: 'flex-start',
  },
  restBadgeText: { ...typography.small, color: colors.warning, fontWeight: '600' },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    alignSelf: 'flex-start',
  },
  listenText: { ...typography.small, color: colors.primary, fontWeight: '600' },

  regularityHint: { ...typography.small, color: colors.textMuted },

  heroCard: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...elevation(2),
  },
  heroOverlay: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroLabel: { ...typography.overline, color: '#FFF4EE' },
  heroTitle: { ...typography.h1, color: '#FFF4EE' },
  heroDesc: { ...typography.body, color: '#FFF4EE', opacity: 0.9 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: spacing.sm,
  },
  heroCtaText: { ...typography.bodyStrong, color: colors.text },

  programCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  programTitle: { ...typography.bodyStrong, color: colors.text },
  programDesc: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
