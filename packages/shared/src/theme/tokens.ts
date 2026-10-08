export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  border: string;
  success: string;
  danger: string;
}

export const defaultPalettes: Record<ThemeMode, Palette> = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F6F8',
    surfaceAlt: '#E9ECF1',
    text: '#14161A',
    textMuted: '#5B6270',
    primary: '#2F6FEB',
    onPrimary: '#FFFFFF',
    accent: '#F59E0B',
    border: '#D5D9E0',
    success: '#1E8E3E',
    danger: '#C62828',
  },
  dark: {
    background: '#0E1013',
    surface: '#181B20',
    surfaceAlt: '#232830',
    text: '#F2F4F7',
    textMuted: '#A3ABB8',
    primary: '#6B9BFF',
    onPrimary: '#0E1013',
    accent: '#FBBF24',
    border: '#2E343E',
    success: '#4CC26B',
    danger: '#FF6B6B',
  },
  'high-contrast': {
    background: '#000000',
    surface: '#000000',
    surfaceAlt: '#1A1A1A',
    text: '#FFFFFF',
    textMuted: '#E0E0E0',
    primary: '#FFD400',
    onPrimary: '#000000',
    accent: '#00E5FF',
    border: '#FFFFFF',
    success: '#00FF7F',
    danger: '#FF5252',
  },
};

/** Spacing scale in dp. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

/** Base font sizes in sp; the theme multiplies by the app's `fontScale`. */
export const baseType = {
  caption: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 16, lineHeight: 22 },
  bodyLarge: { fontSize: 18, lineHeight: 26 },
  title: { fontSize: 22, lineHeight: 28 },
  headline: { fontSize: 28, lineHeight: 34 },
  display: { fontSize: 36, lineHeight: 42 },
} as const;

export type TypeToken = keyof typeof baseType;

export const motion = { fast: 150, normal: 250, slow: 400 } as const;

/** Minimum touch target in dp. Senior/maternity apps pass `touchTarget: 56` to the provider. */
export const MIN_TOUCH = 48;
export const MIN_TOUCH_LARGE = 56;
