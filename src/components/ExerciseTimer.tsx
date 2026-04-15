import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

import { Button } from './Button';
import { colors, radii, spacing, typography } from '@/lib/theme';

type Phase = 'idle' | 'work' | 'rest' | 'done';
type BreathLabel = 'inspire' | 'expire';

type Props = {
  sets: number;
  reps?: number | null;
  durationSec?: number | null;
  restSec?: number | null;
  onComplete?: () => void;
};

/**
 * Minuteur séries / répétitions / repos.
 *
 * Pendant la phase de repos, un anneau animé guide la respiration
 * (inspire 4s / expire 4s) avec `Animated` natif.
 *
 * Deux modes de travail :
 * - durationSec fourni → countdown automatique par série.
 * - sinon → l'utilisateur appuie manuellement sur "Série terminée".
 */
export function ExerciseTimer({ sets, reps, durationSec, restSec, onComplete }: Props) {
  useKeepAwake();

  const totalSets = Math.max(1, sets);
  const hasDuration = !!durationSec && durationSec > 0;
  const effectiveRest = restSec ?? 15;

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentSet, setCurrentSet] = useState(1);
  const [remaining, setRemaining] = useState<number>(durationSec ?? 0);
  const [breathLabel, setBreathLabel] = useState<BreathLabel>('inspire');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathAnim = useRef(new Animated.Value(0.7)).current;
  const breathAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Nettoyage global
  useEffect(() => () => clearTimer(), []);

  // Anneau respiratoire — actif uniquement pendant la phase de repos
  useEffect(() => {
    if (phase !== 'rest') {
      breathAnimRef.current?.stop();
      breathAnim.setValue(0.7);
      setBreathLabel('inspire');
      return;
    }

    breathAnim.setValue(0.7);
    setBreathLabel('inspire');

    breathAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0.7,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    );
    breathAnimRef.current.start();

    // Texte alterné toutes les 4 s
    const labelInterval = setInterval(() => {
      setBreathLabel((l) => (l === 'inspire' ? 'expire' : 'inspire'));
    }, 4000);

    return () => {
      breathAnimRef.current?.stop();
      clearInterval(labelInterval);
    };
  }, [phase, breathAnim]);

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
    breathAnimRef.current?.stop();
    setPhase('idle');
    setCurrentSet(1);
    setRemaining(durationSec ?? 0);
  };

  const label = useMemo(() => {
    if (phase === 'idle') return 'Prêt à commencer ?';
    if (phase === 'done') return 'Série terminée ✔';
    if (phase === 'rest') return `Repos — série ${currentSet} / ${totalSets}`;
    if (hasDuration) return `Série ${currentSet} / ${totalSets} — tenir la position`;
    return `Série ${currentSet} / ${totalSets} — ${reps ?? '?'} répétitions`;
  }, [phase, currentSet, totalSets, hasDuration, reps]);

  const bigNumber =
    phase === 'work' && hasDuration
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

      {/* Anneau respiratoire (visible uniquement pendant le repos) */}
      {phase === 'rest' ? (
        <View style={styles.breathingWrap}>
          <Animated.View
            style={[styles.breathingRing, { transform: [{ scale: breathAnim }] }]}
          >
            <View style={styles.breathingInner}>
              <Text style={styles.breathCount}>{formatTime(remaining)}</Text>
            </View>
          </Animated.View>
          <Text style={styles.breathText}>
            {breathLabel === 'inspire' ? '↑  Inspire…' : '↓  Expire…'}
          </Text>
        </View>
      ) : (
        <Text style={styles.big}>{bigNumber}</Text>
      )}

      {phase === 'idle' && <Button label="Démarrer la séance" onPress={onStart} />}

      {phase === 'work' && !hasDuration && (
        <Button label="Série terminée" onPress={onManualDone} />
      )}
      {phase === 'work' && hasDuration && (
        <Button label="Passer au repos" variant="secondary" onPress={onManualDone} />
      )}

      {phase === 'rest' && (
        <Button
          label="Reprendre maintenant"
          variant="secondary"
          onPress={() => startWorkPhase(currentSet + 1)}
        />
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

  // Anneau respiratoire
  breathingWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  breathingRing: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`, // ~10 % opacité
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathCount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  breathText: {
    ...typography.h3,
    color: colors.primary,
    letterSpacing: 1,
  },
});
