import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';
import type { MoodLevel } from '@/types/database';

type Props = {
  value: MoodLevel | null;
  onChange: (value: MoodLevel) => void;
};

const OPTIONS: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: 1, emoji: '😔', label: 'Fatigué' },
  { value: 2, emoji: '🙂', label: 'Ça va' },
  { value: 3, emoji: '😊', label: 'En forme' },
];

export function MoodCheckin({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.option,
              active && styles.optionActive,
              pressed && !active && styles.optionPressed,
            ]}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  optionPressed: { opacity: 0.7 },
  emoji: { fontSize: 28 },
  label: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
  labelActive: { color: colors.primary },
});
