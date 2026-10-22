import type { FontFamilies, Palette, ThemeMode } from '@shared/theme';

/**
 * "Ember" palette: cool lavender-white surfaces, a deep violet brand and an ember accent for
 * streaks. The violet gradient hero card on Today is the one loud element; everything else stays quiet.
 */
export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#F6F5FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEECF4',
    text: '#17151F',
    textMuted: '#5E5A6E',
    border: '#E3E0EC',
    primary: '#5B3DF5',
    onPrimary: '#FFFFFF',
    primarySoft: '#ECE8FF',
    success: '#0F9F5F',
    accent: '#F2620F', // streak ember
    danger: '#C7372F',
    shadow: '#2A1F66',
  },
  dark: {
    background: '#100E17',
    surface: '#1A1724',
    surfaceAlt: '#24202F',
    text: '#F3F1F8',
    textMuted: '#A9A4BA',
    border: '#2E2A3B',
    primary: '#8B78FF',
    onPrimary: '#100E17',
    primarySoft: '#2A2350',
    success: '#3DD68C',
    accent: '#FF8A4C',
    danger: '#FF6B6B',
    shadow: '#000000',
  },
};

/** Embedded by the expo-font plugin in app.config.ts. */
export const fonts: FontFamilies = { body: 'Figtree', display: 'Bricolage' };

/** App-only colors that have no slot in the shared palette. */
export const extraColors = {
  light: {
    warning: '#C77700',
    frozen: '#8FD3FF',
    heat: ['#ECEAF2', '#D3CAFE', '#A996FB', '#7E62F6', '#5B3DF5'],
    /** Today's hero card. */
    hero: ['#6E50FF', '#4524DA'] as const,
    /** The streak flame chip. */
    ember: ['#FF9A3D', '#F2620F'] as const,
  },
  dark: {
    warning: '#F2B84B',
    frozen: '#5BB6E8',
    heat: ['#24202F', '#3B2F7A', '#5640B8', '#7059EE', '#9C88FF'],
    hero: ['#5B3DF5', '#341BA8'] as const,
    ember: ['#FF9A3D', '#E8580A'] as const,
  },
} as const;

export const habitColors = {
  violet: '#7C5CFF',
  blue: '#3B82F6',
  sky: '#0EA5E9',
  teal: '#14B8A6',
  green: '#22C55E',
  lime: '#84CC16',
  yellow: '#EAB308',
  orange: '#F97316',
  red: '#EF4444',
  pink: '#EC4899',
  rose: '#F472B6',
  slate: '#64748B',
} as const;

export type HabitColorName = keyof typeof habitColors;

export const extraColorsFor = (mode: ThemeMode) => extraColors[mode === 'light' ? 'light' : 'dark'];
