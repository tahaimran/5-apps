import type { FontFamilies, Palette, ThemeMode } from '@shared/theme';

/**
 * "Lagoon": aqua-white surfaces, a deep-water blue brand, leaf green for growth and sun amber for
 * streaks (plan §7.1). Today's gradient hero, filling like a glass, is the one loud element.
 */
export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#F2F8FC',
    surface: '#FFFFFF',
    surfaceAlt: '#E4F1FA',
    text: '#0F2436',
    textMuted: '#506A7E',
    border: '#D3E5F2',
    // The plan's #2B9FE6 is 2.9:1 against white, so text, buttons and links use a deeper brand blue.
    primary: '#136CAD',
    onPrimary: '#FFFFFF',
    primarySoft: '#DCEEFB',
    success: '#1A7A45', // plan leaf #4CBF7A darkened to read as text on the light surfaces
    accent: '#A86200', // streak flame / soft warning, readable as text
    danger: '#C73F3F',
    shadow: '#0B3A66',
  },
  dark: {
    background: '#0B1620',
    surface: '#13212D',
    surfaceAlt: '#1C2E3D',
    text: '#E6F1F9',
    textMuted: '#98AFC2',
    border: '#26394A',
    primary: '#5BB8F5',
    onPrimary: '#0B1620',
    primarySoft: '#16344A',
    success: '#6BD494',
    accent: '#FFD36E',
    danger: '#FF7B7B',
    shadow: '#000000',
  },
};

/** Embedded by the expo-font plugin in app.config.ts. */
export const fonts: FontFamilies = { body: 'Figtree', display: 'Bricolage' };

/**
 * The water waves on the hero: translucent white layers. Their combined alpha is what the contrast
 * test blends under the hero's white text, so raise them only together with that test.
 */
export const WAVE_ALPHA = { back: 0.08, front: 0.1 } as const;

/** Brand colors with no slot in the shared palette (plan §7.1), per mode. */
export const extraColors = {
  light: {
    ring: '#2B9FE6', // decorative fills only (3:1 non-text contrast on the card)
    ringEnd: '#7FD1F7',
    leaf: '#4CBF7A',
    bloom: '#FF8FB1',
    sun: '#FFC94D',
    warning: '#C77700',
    /** Today's hero: deep water, dark enough for white text even under both waves. */
    hero: ['#0B5DA3', '#083F73'] as const,
    /** The hero once the goal is reached. */
    heroDone: ['#0A6542', '#064A30'] as const,
    /** Garden's plant card: a soft leaf-to-water wash behind dark text. */
    garden: ['#E3F6EA', '#E1F0FB'] as const,
    /** Tinted circles behind list icons. */
    leafSoft: '#DDF3E5',
    sunSoft: '#FFF1CC',
  },
  dark: {
    ring: '#5BB8F5',
    ringEnd: '#3A8FC4',
    leaf: '#6BD494',
    bloom: '#FF9FBE',
    sun: '#FFD36E',
    warning: '#F2B84B',
    hero: ['#0A5799', '#07335C'] as const,
    heroDone: ['#0A6542', '#06422B'] as const,
    garden: ['#14281F', '#132536'] as const,
    leafSoft: '#173326',
    sunSoft: '#3A3018',
  },
} as const;

export const extraColorsFor = (mode: ThemeMode) => extraColors[mode === 'light' ? 'light' : 'dark'];
