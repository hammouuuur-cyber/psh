// Palette et tokens UI — thème "Terre & Nature" (chaleureux, organique).
// Deux modes : sombre (défaut) en gris chaud, clair coquille d'œuf.

import { Platform, type ViewStyle } from 'react-native';

// Mode sombre chaud (ne fatigue pas les yeux le soir).
export const colors = {
  background: '#1A1715',       // gris très chaud (presque brun)
  backgroundAlt: '#221E1B',
  surface: '#2B2522',          // cartes
  surfaceAlt: '#3A322E',        // hover / secondary buttons
  border: '#4A403B',

  text: '#F4EFE8',              // blanc cassé chaud
  textMuted: '#A89A8E',

  primary: '#8FBC8F',           // vert sauge
  primaryDark: '#6B8E5A',
  accent: '#E2725B',            // terracotta (boutons d'emphase)
  accentSoft: '#F2B199',
  danger: '#E07A6A',
  warning: '#E9B665',
  success: '#7FB685',

  // Tons "respiration" pour les cercles du minuteur
  breatheOut: '#6B8E5A',
  breatheIn: '#8FBC8F',

  // Overlay calme pour l'écran de fin de séance
  celebration: '#6B8E5A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Toutes les formes sont arrondies — pas d'angles droits.
export const radii = {
  sm: 10,
  md: 18,
  lg: 28,
  xxl: 36,
  pill: 999,
};

// Police système avec variante arrondie quand disponible (iOS: SF Rounded,
// Android: fallback sur sans-serif). Pour une vraie police custom (Nunito,
// Outfit), il faudrait expo-font ; on l'ajoutera plus tard.
const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, fontFamily },
  h3: { fontSize: 18, fontWeight: '700' as const, fontFamily },
  body: { fontSize: 16, fontWeight: '400' as const, fontFamily },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const, fontFamily },
  small: { fontSize: 13, fontWeight: '400' as const, fontFamily },
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, fontFamily },
};

export const elevation = (level: 1 | 2 | 3): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOpacity: level === 1 ? 0.15 : level === 2 ? 0.22 : 0.3,
      shadowRadius: level === 1 ? 8 : level === 2 ? 16 : 22,
      shadowOffset: { width: 0, height: level * 2 },
    },
    android: { elevation: level * 3 },
    default: {},
  }) as ViewStyle;

export const gradients = {
  primary: [colors.primaryDark, colors.primary] as const,
  accent: [colors.accent, colors.accentSoft] as const,
  celebration: ['#6B8E5A', '#8FBC8F'] as const,
};
