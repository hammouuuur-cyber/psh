import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/Button';
import { EffortScale } from '@/components/EffortScale';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useActiveSession,
  useProgramDetail,
  useProgramHistory,
  useSessionCompletions,
  useSubscribedPrograms,
} from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const patientId = session?.user?.id;

  const { data, isLoading } = useProgramDetail(id);
  const { data: subscribed } = useSubscribedPrograms(patientId);
  const { data: activeSession } = useActiveSession(patientId, id);
  const { data: completions } = useSessionCompletions(activeSession?.id);
  const { data: history } = useProgramHistory(patientId, id);

  const [showFeedback, setShowFeedback] = useState(false);
  const [effort, setEffort] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  const isSubscribed = useMemo(
    () => subscribed?.some((p) => p.id === id) ?? false,
    [subscribed, id],
  );

  const completedIds = useMemo(
    () => new Set((completions ?? []).map((c) => c.program_exercise_id)),
    [completions],
  );

  const items = data?.items ?? [];
  const total = items.length;
  const done = items.filter((it) => completedIds.has(it.id)).length;
  const allDone = total > 0 && done === total;

  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: ['program_session', 'active', patientId, id] });
    queryClient.invalidateQueries({ queryKey: ['exercise_completions'] });
    queryClient.invalidateQueries({ queryKey: ['program_session', 'history', patientId, id] });
    queryClient.invalidateQueries({ queryKey: ['recent_activity', patientId] });
  };

  const subscribe = async () => {
    if (!patientId || !id) return;
    const { error } = await supabase
      .from('subscriptions')
      .insert({ patient_id: patientId, program_id: id });
    if (error) Alert.alert('Erreur', error.message);
    else queryClient.invalidateQueries({ queryKey: ['programs', 'subscribed'] });
  };

  const unsubscribe = async () => {
    if (!patientId || !id) return;
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('patient_id', patientId)
      .eq('program_id', id);
    if (error) Alert.alert('Erreur', error.message);
    else queryClient.invalidateQueries({ queryKey: ['programs', 'subscribed'] });
  };

  const startSession = async () => {
    if (!patientId || !id) return;
    const { error } = await supabase
      .from('program_sessions')
      .insert({ patient_id: patientId, program_id: id });
    if (error) {
      Alert.alert('Impossible de démarrer', error.message);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    invalidateSession();
  };

  const toggleCompletion = async (programExerciseId: string) => {
    if (!activeSession) return;
    const already = completedIds.has(programExerciseId);
    if (already) {
      const { error } = await supabase
        .from('exercise_completions')
        .delete()
        .eq('session_id', activeSession.id)
        .eq('program_exercise_id', programExerciseId);
      if (error) {
        Alert.alert('Erreur', error.message);
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      const { error } = await supabase
        .from('exercise_completions')
        .insert({ session_id: activeSession.id, program_exercise_id: programExerciseId });
      if (error) {
        Alert.alert('Erreur', error.message);
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    queryClient.invalidateQueries({ queryKey: ['exercise_completions', activeSession.id] });
  };

  const openFeedback = () => {
    setEffort(null);
    setFeedbackNote('');
    setShowFeedback(true);
  };

  const completeSession = async () => {
    if (!activeSession) return;
    setSavingFeedback(true);
    const { error } = await supabase
      .from('program_sessions')
      .update({
        completed_at: new Date().toISOString(),
        perceived_effort: effort,
        feedback_note: feedbackNote.trim() || null,
      })
      .eq('id', activeSession.id);
    setSavingFeedback(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowFeedback(false);
    invalidateSession();
  };

  const cancelSession = async () => {
    if (!activeSession) return;
    Alert.alert(
      'Annuler la séance ?',
      'La progression en cours sera supprimée.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('program_sessions').delete().eq('id', activeSession.id);
            invalidateSession();
          },
        },
      ],
    );
  };

  if (isLoading || !data?.program) {
    return (
      <Screen>
        <Text style={styles.muted}>Chargement…</Text>
      </Screen>
    );
  }

  const { program } = data;

  // -- Écran intermédiaire "fin de séance" avec retour d'effort
  if (showFeedback) {
    return (
      <Screen>
        <View style={styles.celebrateCard}>
          <Text style={styles.celebrateEmoji}>🌿</Text>
          <Text style={styles.celebrateTitle}>Bravo, séance terminée !</Text>
          <Text style={styles.celebrateBody}>
            Prenez un instant pour noter votre ressenti. Ces informations
            aideront votre kinésithérapeute à ajuster le programme.
          </Text>
        </View>

        <Text style={styles.section}>Quel effort cela vous a-t-il demandé ?</Text>
        <EffortScale value={effort} onChange={setEffort} />

        <Text style={styles.section}>Une note pour votre kiné ? (optionnel)</Text>
        <TextField
          value={feedbackNote}
          onChangeText={setFeedbackNote}
          placeholder="Ex : j'ai senti une tension dans la jambe droite…"
          multiline
          numberOfLines={3}
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />

        <Button
          label="Valider ma séance"
          onPress={completeSession}
          loading={savingFeedback}
        />
        <Button label="Plus tard" variant="ghost" onPress={() => setShowFeedback(false)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{program.title}</Text>
      {program.description ? <Text style={styles.desc}>{program.description}</Text> : null}

      {/* Bouton d'abonnement (toujours visible) */}
      {isSubscribed ? (
        <Button label="Se désabonner" variant="ghost" onPress={unsubscribe} />
      ) : (
        <Button label="S'abonner à ce programme" onPress={subscribe} />
      )}

      {/* Bloc "séance" (visible pour les abonnés) */}
      {isSubscribed ? (
        <View style={styles.sessionCard}>
          {activeSession ? (
            <>
              <Text style={styles.sessionTitle}>Séance en cours</Text>
              <ProgressBar value={done} max={total} label="Progression" />
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                {allDone ? (
                  <Button
                    label="Terminer la séance"
                    onPress={openFeedback}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Button
                    label="Annuler"
                    variant="ghost"
                    onPress={cancelSession}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sessionTitle}>Prêt à commencer ?</Text>
              <Text style={styles.sessionSubtitle}>
                {total > 0
                  ? `${total} exercice${total > 1 ? 's' : ''} vous attendent. Allez-y à votre rythme.`
                  : 'Aucun exercice dans ce programme pour l\'instant.'}
              </Text>
              <Button
                label="Commencer la séance"
                onPress={startSession}
                disabled={total === 0}
              />
            </>
          )}
        </View>
      ) : null}

      <Text style={styles.section}>Exercices ({items.length})</Text>
      <View style={{ gap: spacing.sm }}>
        {items.map((item) => {
          const isDone = completedIds.has(item.id);
          const hasSession = !!activeSession;
          return (
            <View key={item.id} style={[styles.card, isDone && styles.cardDone]}>
              {hasSession ? (
                <Pressable
                  onPress={() => toggleCompletion(item.id)}
                  style={styles.checkboxWrap}
                  hitSlop={8}
                >
                  <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={20} color={colors.text} />
                    ) : null}
                  </View>
                </Pressable>
              ) : null}
              <Pressable
                style={{ flex: 1 }}
                onPress={() => router.push(`/(patient)/exercise/${item.exercise_id}` as never)}
              >
                <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>
                  {item.order + 1}. {item.exercises.title}
                </Text>
                <Text style={styles.meta}>
                  {summarize(item)}
                </Text>
                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              </Pressable>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          );
        })}
      </View>

      {/* Historique */}
      {(history ?? []).length > 0 ? (
        <>
          <Text style={styles.section}>Séances récentes</Text>
          {(history ?? []).map((s) => (
            <View key={s.id} style={styles.historyRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.historyDate}>
                {s.completed_at ? formatDate(s.completed_at) : ''}
              </Text>
              {s.perceived_effort ? (
                <Text style={styles.historyEffort}>
                  · effort {s.perceived_effort}/5
                </Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function summarize(item: {
  sets: number | null;
  reps: number | null;
  duration_sec: number | null;
  rest_sec: number | null;
  exercises: {
    default_sets: number | null;
    default_reps: number | null;
    default_duration_sec: number | null;
    default_rest_sec: number | null;
  };
}) {
  const sets = item.sets ?? item.exercises.default_sets;
  const reps = item.reps ?? item.exercises.default_reps;
  const dur = item.duration_sec ?? item.exercises.default_duration_sec;
  const parts: string[] = [];
  if (sets) parts.push(`${sets} série${sets > 1 ? 's' : ''}`);
  if (dur) parts.push(`${dur}s`);
  else if (reps) parts.push(`${reps} reps`);
  return parts.join(' · ') || 'À votre rythme';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  desc: { ...typography.body, color: colors.textMuted },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  sessionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...elevation(1),
  },
  sessionTitle: { ...typography.h3, color: colors.text },
  sessionSubtitle: { ...typography.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardDone: { opacity: 0.75, borderColor: colors.primary },
  cardTitle: { ...typography.bodyStrong, color: colors.text },
  cardTitleDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  meta: { ...typography.small, color: colors.primary, marginTop: 2 },
  notes: { ...typography.small, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  muted: { ...typography.body, color: colors.textMuted },
  checkboxWrap: { paddingRight: 4 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  celebrateCard: {
    backgroundColor: colors.celebration,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...elevation(2),
  },
  celebrateEmoji: { fontSize: 48 },
  celebrateTitle: { ...typography.h1, color: colors.text, textAlign: 'center' },
  celebrateBody: { ...typography.body, color: '#F4EFE8', textAlign: 'center' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  historyDate: { ...typography.body, color: colors.text },
  historyEffort: { ...typography.small, color: colors.textMuted },
});
