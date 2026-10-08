import type { Palette, ThemeMode } from '@shared/theme';

/** Brand palette from DEVELOPMENT_PLAN.md §7 mapped onto the shared theme tokens. */
export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceAlt: '#F1EEE9',
    text: '#1B1D22',
    textMuted: '#5C6370',
    border: '#E4E0DA',
    primary: '#6C4CF1',
    onPrimary: '#FFFFFF',
    success: '#1F9D61',
    accent: '#FF7A1A', // streak flame
    danger: '#D23B3B',
  },
  dark: {
    background: '#0F1115',
    surface: '#181B21',
    surfaceAlt: '#21252D',
    text: '#F2F3F5',
    textMuted: '#A3A9B5',
    border: '#2C313A',
    primary: '#8B73FF',
    onPrimary: '#0F1115',
    success: '#3DD68C',
    accent: '#FF9A4D',
    danger: '#FF6B6B',
  },
};

/** App-only colors that have no slot in the shared palette. */
export const extraColors = {
  light: {
    warning: '#C77700',
    frozen: '#8FD3FF',
    heat: ['#EBE8E3', '#C9BEFB', '#A08BF7', '#7A5DF2', '#5534D6'],
  },
  dark: {
    warning: '#F2B84B',
    frozen: '#5BB6E8',
    heat: ['#22262E', '#3A2F73', '#5340B0', '#7058E6', '#9C88FF'],
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
