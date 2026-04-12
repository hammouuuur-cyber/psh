import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePathologies } from '@/lib/queries';
import { colors, radii, spacing, typography } from '@/lib/theme';

type Props = {
  selected: string[]; // codes
  onChange: (codes: string[]) => void;
};

/**
 * Sélecteur multi-choix des pathologies. Affiche des chips togglables.
 */
export function PathologyPicker({ selected, onChange }: Props) {
  const { data: pathologies, isLoading } = usePathologies();

  if (isLoading) return <Text style={styles.hint}>Chargement…</Text>;

  return (
    <View style={styles.wrap}>
      {(pathologies ?? []).map((p) => {
        const active = selected.includes(p.code);
        return (
          <Pressable
            key={p.id}
            onPress={() => {
              if (active) onChange(selected.filter((c) => c !== p.code));
              else onChange([...selected, p.code]);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{p.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { ...typography.small, color: colors.text },
  chipLabelActive: { color: '#0F172A', fontWeight: '700' },
  hint: { ...typography.small, color: colors.textMuted },
});
