import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

type Props = {
  value: number;
  max: number;
  label?: string;
  /** Affiche un libellé type "3 / 7" à droite si true. */
  showCount?: boolean;
  color?: string;
};

export function ProgressBar({ value, max, label, showCount = true, color = colors.primary }: Props) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;

  return (
    <View>
      {(label || showCount) ? (
        <View style={styles.row}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showCount ? (
            <Text style={styles.count}>
              {value} / {max}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
  count: { ...typography.small, color: colors.text, fontWeight: '700' },
  track: {
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
