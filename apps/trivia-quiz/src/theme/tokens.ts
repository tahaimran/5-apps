import type { FontFamilies, Palette, ThemeMode } from '@shared/theme';
import type { TextScale } from '@/domain/types';

/**
 * "Spark" (plan §7): lavender-white surfaces, an electric violet brand and a sunny quiz gold for
 * stars, XP and the one big call to action. The quiz screen is the loud part: a violet stage with
 * white answer pills. Every text pair is checked in theme/__tests__/contrast.test.ts.
 */
export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#F6F4FD',
    surface: '#FFFFFF',
    surfaceAlt: '#ECE8FA',
    text: '#1C1838',
    textMuted: '#5C5878',
    border: '#E1DCF2',
    primary: '#5B3FE0',
    onPrimary: '#FFFFFF',
    primarySoft: '#ECE8FF',
    success: '#137A47',
    // Gold darkened until it reads as text; the bright gold stays for fills (extraColors.gold).
    accent: '#9A5B00',
    danger: '#C8324D',
    shadow: '#2A1F6B',
  },
  dark: {
    background: '#100D22',
    surface: '#1A1631',
    surfaceAlt: '#2A2350',
    text: '#EFEDFB',
    textMuted: '#ABA6C9',
    border: '#3A3266',
    primary: '#A796FF',
    onPrimary: '#100D22',
    primarySoft: '#2C2558',
    success: '#4FD18B',
    accent: '#FFC940',
    danger: '#FF7D92',
    shadow: '#000000',
  },
};

/** Embedded by the expo-font plugin in app.config.ts. */
export const fonts: FontFamilies = { body: 'Figtree', display: 'Bricolage' };

/**
 * Frosted white layers on the violet stage (chips, lifelines, the close button). The contrast test
 * blends this alpha under white text on the lightest stage stop, so raise it only with that test.
 */
export const FROST = 0.16;
export const frost = `#FFFFFF${Math.round(FROST * 255).toString(16).padStart(2, '0').toUpperCase()}`;

/** Brand colors with no slot in the shared palette, per mode. */
export const extraColors = {
  light: {
    /** Stars, XP fills, the timer ring and the stage's main button (fills only, never text on white). */
    gold: '#FFC940',
    onGold: '#1C1838',
    goldSoft: '#FFF3CC',
    /** The streak flame (fill). */
    streak: '#D9520A',
    streakSoft: '#FFEADB',
    successSoft: '#DDF5E8',
    dangerSoft: '#FCE3E8',
    /** The quiz stage and the Daily hero: violet, dark enough for white text even under frost. */
    stage: ['#5B3FE0', '#3B24B0'] as const,
    /** The question card and the explanation on the stage, and the timer ring's track on it. */
    card: '#FFFFFF',
    cardTrack: '#ECE8FF',
    /** An answer before it is chosen: a white pill on the stage. */
    answer: '#FFFFFF',
    onAnswer: '#1C1838',
    answerBadge: '#ECE8FF',
    /** Chosen-right and chosen-wrong fills, white text on both (also the ✓ / ✗ icons). */
    correct: '#137A47',
    wrong: '#C02A47',
    onFill: '#FFFFFF',
  },
  dark: {
    gold: '#FFC940',
    onGold: '#1C1838',
    goldSoft: '#3A3018',
    streak: '#FF9A55',
    streakSoft: '#3D2618',
    successSoft: '#163527',
    dangerSoft: '#3D1A24',
    stage: ['#271E66', '#140F38'] as const,
    // On the dark stage the card rises (lighter), like every raised layer in dark mode.
    card: '#312985',
    cardTrack: '#4A41A0',
    // Raised above the stage (lighter, not darker), or the pills read as holes.
    answer: '#463B9E',
    onAnswer: '#F3F1FF',
    answerBadge: '#5A4FB5',
    correct: '#137A47',
    wrong: '#C02A47',
    onFill: '#FFFFFF',
  },
} as const;

export type ExtraColors = (typeof extraColors)['light' | 'dark'];
export const extraColorsFor = (mode: ThemeMode): ExtraColors => extraColors[mode === 'light' ? 'light' : 'dark'];

export const TEXT_SCALES: readonly TextScale[] = [0.9, 1, 1.15, 1.3];

/** Plan §7 type scale in sp, before the text-size setting and the system font scale. */
export const baseTypeScale = {
  display: { fontSize: 34, lineHeight: 40 },
  h1: { fontSize: 26, lineHeight: 32 },
  h2: { fontSize: 20, lineHeight: 26 },
  question: { fontSize: 22, lineHeight: 30 },
  answer: { fontSize: 17, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 18 },
  overline: { fontSize: 12, lineHeight: 16 },
} as const;
export type TypeName = keyof typeof baseTypeScale;

/** The styles set in the display family (Bricolage); the rest use the body family (Figtree). */
export const DISPLAY_STYLES: readonly TypeName[] = ['display', 'h1', 'h2', 'question'];

export const scaledType = (scale: TextScale): Record<TypeName, { fontSize: number; lineHeight: number }> =>
  Object.fromEntries(
    Object.entries(baseTypeScale).map(([k, v]) => [k, { fontSize: Math.round(v.fontSize * scale), lineHeight: Math.round(v.lineHeight * scale) }]),
  ) as Record<TypeName, { fontSize: number; lineHeight: number }>;

/** Plan §7: answer buttons are at least 56dp; every other control 48dp. */
export const TOUCH_TARGET = 48;
export const ANSWER_MIN_HEIGHT = 60;
