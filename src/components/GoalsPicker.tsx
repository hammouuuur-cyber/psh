import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

export const GOALS: { code: string; emoji: string; label: string }[] = [
  { code: 'equilibre', emoji: '🧘', label: 'Équilibre & posture' },
  { code: 'raideurs', emoji: '🌿', label: 'Réduire les raideurs' },
  { code: 'renforcement', emoji: '💪', label: 'Renforcement doux' },
  { code: 'coordination', emoji: '🎯', label: 'Coordination' },
  { code: 'douleur', emoji: '😌', label: 'Gestion de la douleur' },
  { code: 'marche', emoji: '🚶', label: 'Améliorer la marche' },
];

type Props = {
  selected: string[];
  onChange: (codes: string[]) => void;
};

export function GoalsPicker({ selected, onChange }: Props) {
  const toggle = (code: string) => {
    onChange(
      selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code],
    );
  };

  return (
    <View style={styles.grid}>
      {GOALS.map((g) => {
        const active = selected.includes(g.code);
        return (
          <Pressable
            key={g.code}
            onPress={() => toggle(g.code)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && !active && styles.chipPressed,
            ]}
          >
            <Text style={styles.emoji}>{g.emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{g.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}20`,
  },
  chipPressed: { opacity: 0.7 },
  emoji: { fontSize: 18 },
  label: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
  labelActive: { color: colors.accent },
});
