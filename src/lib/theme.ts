// Palette et tokens UI — thème sombre "médical calme".
// Contraste élevé, tailles de texte généreuses, touches larges (>= 48 px).

import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  background: '#0B1220',       // fond principal (plus sombre que surface)
  backgroundAlt: '#0F172A',    // fond secondaire (au-dessus des cartes)
  surface: '#111C2F',          // cartes / inputs
  surfaceAlt: '#1B2942',       // hover / pressed / secondary button
  border: '#233654',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  primary: '#14B8A6',          // teal-500
  primaryDark: '#0D9488',      // teal-600
  accent: '#38BDF8',            // sky-400
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1 },
};

// Ombre portée cross-platform. iOS utilise shadow*, Android elevation.
export const elevation = (level: 1 | 2 | 3): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOpacity: level === 1 ? 0.15 : level === 2 ? 0.22 : 0.3,
      shadowRadius: level === 1 ? 6 : level === 2 ? 12 : 18,
      shadowOffset: { width: 0, height: level * 2 },
    },
    android: { elevation: level * 3 },
    default: {},
  }) as ViewStyle;

export const gradients = {
  primary: [colors.primaryDark, colors.accent] as const,
};
