export const Colors = {
  // Backgrounds
  bg: '#12121E',
  surface: '#1E1E30',
  surfaceAlt: '#252538',
  border: '#2E2E48',

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#9090B0',
  textMuted: '#55556A',

  // Accent
  accent: '#7C6AF5',
  accentLight: '#A59AF8',

  // Status
  success: '#6BCB77',
  warning: '#FFD93D',
  danger: '#FF6B6B',

  // Tab bar
  tabActive: '#7C6AF5',
  tabInactive: '#55556A',
  tabBar: '#1A1A2C',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};
