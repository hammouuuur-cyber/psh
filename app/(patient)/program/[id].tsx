import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useProgramDetail, useSubscribedPrograms } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useProgramDetail(id);
  const { data: subscribed } = useSubscribedPrograms(session?.user?.id);

  const isSubscribed = useMemo(
    () => subscribed?.some((p) => p.id === id) ?? false,
    [subscribed, id],
  );

  const subscribe = async () => {
    if (!session?.user?.id || !id) return;
    const { error } = await supabase
      .from('subscriptions')
      .insert({ patient_id: session.user.id, program_id: id });
    if (error) Alert.alert('Erreur', error.message);
    else queryClient.invalidateQueries({ queryKey: ['programs', 'subscribed'] });
  };

  const unsubscribe = async () => {
    if (!session?.user?.id || !id) return;
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('patient_id', session.user.id)
      .eq('program_id', id);
    if (error) Alert.alert('Erreur', error.message);
    else queryClient.invalidateQueries({ queryKey: ['programs', 'subscribed'] });
  };

  if (isLoading || !data?.program) {
    return (
      <Screen>
        <Text style={styles.muted}>Chargement…</Text>
      </Screen>
    );
  }

  const { program, items } = data;

  return (
    <Screen>
      <Text style={styles.title}>{program.title}</Text>
      {program.description ? <Text style={styles.desc}>{program.description}</Text> : null}

      {isSubscribed ? (
        <Button label="Se désabonner" variant="ghost" onPress={unsubscribe} />
      ) : (
        <Button label="S'abonner à ce programme" onPress={subscribe} />
      )}

      <Text style={styles.section}>Exercices ({items.length})</Text>
      <View style={{ gap: spacing.sm }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => router.push(`/(patient)/exercise/${item.exercise_id}` as never)}
          >
            <Text style={styles.cardTitle}>
              {item.order + 1}. {item.exercises.title}
            </Text>
            <Text style={styles.meta}>
              {(item.sets ?? item.exercises.default_sets ?? 3)} séries ·{' '}
              {item.duration_sec ?? item.exercises.default_duration_sec
                ? `${item.duration_sec ?? item.exercises.default_duration_sec}s`
                : `${item.reps ?? item.exercises.default_reps ?? '?'} reps`}
            </Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  desc: { ...typography.body, color: colors.textMuted },
  section: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.md, gap: 4 },
  cardTitle: { ...typography.h3, color: colors.text },
  meta: { ...typography.small, color: colors.primary },
  notes: { ...typography.small, color: colors.textMuted, fontStyle: 'italic' },
  muted: { ...typography.body, color: colors.textMuted },
});
