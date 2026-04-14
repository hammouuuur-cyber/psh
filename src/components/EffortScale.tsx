import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

type Props = {
  value: number | null;
  onChange: (value: number) => void;
};

// Échelle de Borg simplifiée (1 à 5), avec un vocabulaire non culpabilisant.
const LEVELS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '🪶', label: 'Très léger' },
  { value: 2, emoji: '🌿', label: 'Léger' },
  { value: 3, emoji: '🌳', label: 'Modéré' },
  { value: 4, emoji: '⛰️', label: 'Intense' },
  { value: 5, emoji: '🏔️', label: 'Très intense' },
];

export function EffortScale({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {LEVELS.map((lvl) => {
        const active = value === lvl.value;
        return (
          <Pressable
            key={lvl.value}
            onPress={() => onChange(lvl.value)}
            style={({ pressed }) => [
              styles.item,
              active && styles.itemActive,
              pressed && !active && styles.itemPressed,
            ]}
          >
            <Text style={styles.emoji}>{lvl.emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{lvl.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  item: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 2,
  },
  itemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
  },
  itemPressed: { opacity: 0.7 },
  emoji: { fontSize: 22 },
  label: { ...typography.small, color: colors.textMuted, textAlign: 'center', fontSize: 11 },
  labelActive: { color: colors.accent, fontWeight: '700' },
});
