import type { Palette, ThemeMode } from '@shared/theme';
import type { TextScale } from '@/domain/types';

/**
 * Palette from DEVELOPMENT_PLAN.md §7 mapped onto the shared theme tokens. Where a plan colour fails
 * 4.5:1 as text (gold, green, red on white) the text-safe shade is used and the plan colour stays for
 * non-text fills (stars, the flame); see theme/__tests__/contrast.test.ts.
 */
export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF2F7',
    text: '#0F172A',
    textMuted: '#475569',
    border: '#8392A8', // the plan's #E2E8F0 is a hairline; controls need a visible 3:1 edge
    primary: '#4F46E5',
    onPrimary: '#FFFFFF',
    success: '#15803D',
    accent: '#B45309',
    danger: '#B91C1C',
  },
  dark: {
    background: '#0B1020',
    surface: '#151B2E',
    surfaceAlt: '#1E2640',
    text: '#E5E7EB',
    textMuted: '#A5B1C5',
    border: '#5F6D8C',
    primary: '#818CF8',
    onPrimary: '#0B1020',
    success: '#4ADE80',
    accent: '#FBBF24',
    danger: '#F87171',
  },
};

/** Colours the shared palette has no slot for. */
export interface ExtraColors {
  /** Stars and XP fills (not text). */
  star: string;
  /** The streak flame (not text). */
  streak: string;
  primaryContainer: string;
  /** Text on a filled success or danger surface. */
  onSuccess: string;
  onDanger: string;
  /** Tint behind a correct / wrong answer row. */
  successTint: string;
  dangerTint: string;
}

export const extraColors: Record<ThemeMode, ExtraColors> = {
  light: { star: '#F59E0B', streak: '#F97316', primaryContainer: '#E0E7FF', onSuccess: '#FFFFFF', onDanger: '#FFFFFF', successTint: '#DCFCE7', dangerTint: '#FEE2E2' },
  dark: { star: '#FBBF24', streak: '#FB923C', primaryContainer: '#312E81', onSuccess: '#0B1020', onDanger: '#0B1020', successTint: '#14351F', dangerTint: '#3F1D1D' },
  'high-contrast': { star: '#FFD400', streak: '#FF9100', primaryContainer: '#1A1A1A', onSuccess: '#000000', onDanger: '#000000', successTint: '#003300', dangerTint: '#330000' },
};

export const TEXT_SCALES: readonly TextScale[] = [0.9, 1, 1.15, 1.3];

/** Plan §7 type scale in sp, before the text-size setting and the system font scale. */
export const baseTypeScale = {
  display: { fontSize: 32, lineHeight: 40 },
  h1: { fontSize: 24, lineHeight: 32 },
  h2: { fontSize: 20, lineHeight: 28 },
  question: { fontSize: 20, lineHeight: 28 },
  answer: { fontSize: 17, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 18 },
  overline: { fontSize: 12, lineHeight: 16 },
} as const;
export type TypeName = keyof typeof baseTypeScale;

export const scaledType = (scale: TextScale): Record<TypeName, { fontSize: number; lineHeight: number }> =>
  Object.fromEntries(
    Object.entries(baseTypeScale).map(([k, v]) => [k, { fontSize: Math.round(v.fontSize * scale), lineHeight: Math.round(v.lineHeight * scale) }]),
  ) as Record<TypeName, { fontSize: number; lineHeight: number }>;

/** Plan §7: answer buttons are at least 56dp; every other control 48dp. */
export const TOUCH_TARGET = 48;
export const ANSWER_MIN_HEIGHT = 56;
