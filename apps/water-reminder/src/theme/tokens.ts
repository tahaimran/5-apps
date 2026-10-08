import type { Palette, ThemeMode } from '@shared/theme';

/** Brand palette from DEVELOPMENT_PLAN.md §7.1 mapped onto the shared theme tokens. */
export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#F4FAFE',
    surface: '#FFFFFF',
    surfaceAlt: '#E6F3FC',
    text: '#11263A',
    textMuted: '#5A7184',
    border: '#CFE2F0',
    // The plan's #2B9FE6 is 2.9:1 against white, so buttons and links use the deeper brand blue.
    primary: '#1572B6',
    onPrimary: '#FFFFFF',
    success: '#1A7A45', // plan leaf #4CBF7A darkened to read as text on the light surfaces
    accent: '#A86200', // streak flame / soft warning, readable as text
    danger: '#C73F3F',
  },
  dark: {
    background: '#0E1A24',
    surface: '#16242F',
    surfaceAlt: '#1E3140',
    text: '#E8F2F9',
    textMuted: '#9DB3C4',
    border: '#2B4254',
    primary: '#5BB8F5',
    onPrimary: '#0E1A24',
    success: '#6BD494',
    accent: '#FFD36E',
    danger: '#FF7B7B',
  },
};

/** Brand colors with no slot in the shared palette (plan §7.1), per mode. */
export const extraColors = {
  light: {
    ring: '#2B9FE6', // decorative fills only (3:1 non-text contrast on the card)
    ringEnd: '#7FD1F7',
    leaf: '#4CBF7A',
    bloom: '#FF8FB1',
    sun: '#FFC94D',
    warning: '#C77700',
  },
  dark: {
    ring: '#5BB8F5',
    ringEnd: '#3A8FC4',
    leaf: '#6BD494',
    bloom: '#FF9FBE',
    sun: '#FFD36E',
    warning: '#F2B84B',
  },
} as const;

export const extraColorsFor = (mode: ThemeMode) => extraColors[mode === 'light' ? 'light' : 'dark'];
