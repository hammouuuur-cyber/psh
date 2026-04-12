import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

import { Button } from './Button';
import { colors, radii, spacing, typography } from '@/lib/theme';

type Phase = 'idle' | 'work' | 'rest' | 'done';

type Props = {
  sets: number;
  reps?: number | null; // affichage informatif si pas de durée
  durationSec?: number | null; // durée de chaque série ; si absent, on affiche juste les reps
  restSec?: number | null; // durée de repos entre séries
  onComplete?: () => void;
};

/**
 * Minuteur séries / répétitions / repos.
 *
 * Deux modes :
 * - Si `durationSec` est fourni → mode "maintien" : countdown de durationSec par série.
 * - Sinon → mode "répétitions comptées" : l'utilisateur appuie sur "Série terminée" pour
 *   passer au repos.
 *
 * L'écran reste allumé pendant toute la séance (`useKeepAwake`).
 */
export function ExerciseTimer({ sets, reps, durationSec, restSec, onComplete }: Props) {
  useKeepAwake();

  const totalSets = Math.max(1, sets);
  const hasDuration = !!durationSec && durationSec > 0;
  const effectiveRest = restSec ?? 15;

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentSet, setCurrentSet] = useState(1);
  const [remaining, setRemaining] = useState<number>(durationSec ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Nettoyage
  useEffect(() => clearTimer, []);

  const startWorkPhase = (setNumber: number) => {
    setCurrentSet(setNumber);
    setPhase('work');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (hasDuration) {
      setRemaining(durationSec!);
      clearTimer();
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearTimer();
            finishWork(setNumber);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
  };

  const finishWork = (setNumber: number) => {
    clearTimer();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (setNumber >= totalSets) {
      setPhase('done');
      onComplete?.();
      return;
    }
    startRestPhase(setNumber);
  };

  const startRestPhase = (setJustDone: number) => {
    setPhase('rest');
    setRemaining(effectiveRest);
    clearTimer();
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearTimer();
          startWorkPhase(setJustDone + 1);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const onStart = () => startWorkPhase(1);
  const onManualDone = () => finishWork(currentSet);
  const onCancel = () => {
    clearTimer();
    setPhase('idle');
    setCurrentSet(1);
    setRemaining(durationSec ?? 0);
  };

  const label = useMemo(() => {
    if (phase === 'idle') return 'Prêt à commencer ?';
    if (phase === 'done') return 'Séance terminée ✔';
    if (phase === 'rest') return `Repos — série ${currentSet}/${totalSets} terminée`;
    if (hasDuration) return `Série ${currentSet}/${totalSets} — tenir la position`;
    return `Série ${currentSet}/${totalSets} — ${reps ?? '?'} répétitions`;
  }, [phase, currentSet, totalSets, hasDuration, reps]);

  const bigNumber = phase === 'work' && hasDuration
    ? formatTime(remaining)
    : phase === 'rest'
      ? formatTime(remaining)
      : phase === 'work'
        ? `${reps ?? ''}`
        : phase === 'done'
          ? '✔'
          : `${totalSets}×${hasDuration ? formatTime(durationSec!) : (reps ?? '?')}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.big}>{bigNumber}</Text>

      {phase === 'idle' && <Button label="Démarrer la séance" onPress={onStart} />}

      {phase === 'work' && !hasDuration && (
        <Button label="Série terminée" onPress={onManualDone} />
      )}
      {phase === 'work' && hasDuration && (
        <Button label="Passer au repos" variant="secondary" onPress={onManualDone} />
      )}

      {phase === 'rest' && (
        <Button label="Reprendre maintenant" variant="secondary" onPress={() => startWorkPhase(currentSet + 1)} />
      )}

      {phase !== 'idle' && phase !== 'done' && (
        <Button label="Arrêter" variant="ghost" onPress={onCancel} />
      )}

      {phase === 'done' && (
        <Button label="Recommencer" variant="secondary" onPress={onCancel} />
      )}
    </View>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  label: { ...typography.h3, color: colors.textMuted, textAlign: 'center' },
  big: { fontSize: 64, fontWeight: '800', color: colors.primary, marginVertical: spacing.sm },
});
