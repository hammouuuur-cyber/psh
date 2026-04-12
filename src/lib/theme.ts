// Palette et tokens UI minimalistes, adaptés à une lecture confortable
// (contraste élevé, tailles de texte plutôt grandes, touches larges).

export const colors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  border: '#475569',
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  primary: '#22D3EE',
  primaryDark: '#0891B2',
  accent: '#A78BFA',
  danger: '#F87171',
  success: '#4ADE80',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
};
