import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style, icon }: Props) {
  const isDisabled = disabled || loading;
  const labelColor =
    variant === 'primary' || variant === 'danger'
      ? '#051014'
      : variant === 'ghost'
        ? colors.primary
        : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        variant !== 'ghost' && elevation(1),
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.inner}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent', minHeight: 44 },
  disabled: { opacity: 0.5 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { marginRight: 0 },
  label: { ...typography.bodyStrong, fontWeight: '700' },
});
