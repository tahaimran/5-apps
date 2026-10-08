import type { Palette, ThemeMode } from '@shared/theme';
import type { TextSize } from '@/domain/types';

/** Palette from DEVELOPMENT_PLAN.md §7.1 mapped onto the shared theme tokens. */
export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#FBF7EF',
    surface: '#FFFFFF',
    surfaceAlt: '#F3ECDD',
    text: '#1B1B1F',
    textMuted: '#4A4A55',
    border: '#B9AF98', // the plan's #E3DCCD is for the grid lines; controls need a visible 3:1 edge
    primary: '#1F5FAF',
    onPrimary: '#FFFFFF',
    success: '#2E7D32',
    accent: '#B45309',
    danger: '#B3261E',
  },
  dark: {
    background: '#121417',
    surface: '#1E2227',
    surfaceAlt: '#262B31',
    text: '#F2F2F2',
    textMuted: '#C5C9D0',
    border: '#6B7480',
    primary: '#7FB3FF',
    onPrimary: '#0B1A2E',
    success: '#81C784',
    accent: '#FBBF24',
    danger: '#FF8A80',
  },
  'high-contrast': {
    background: '#000000',
    surface: '#000000',
    surfaceAlt: '#000000',
    text: '#FFFFFF',
    textMuted: '#FFFF00',
    border: '#FFFFFF',
    primary: '#FFFF00',
    onPrimary: '#000000',
    success: '#00FF00',
    accent: '#FFA500',
    danger: '#FF6B6B',
  },
};

export interface GameColors {
  gridCell: string;
  gridBorder: string;
  /** In-drag selection fill (already with alpha). */
  selection: string;
  /** Highlight rotation for found words; solid outlines in high contrast. */
  highlights: readonly string[];
  /** The fill alpha for highlights (the outline is drawn solid in high contrast). */
  highlightAlpha: number;
  /** Text color that stays readable on a highlighted cell. */
  onHighlight: string;
  hintRing: string;
}

const HUES = ['#F4A261', '#8ECAE6', '#B5E48C', '#F7B2BD', '#CDB4DB', '#FFD166'] as const;

export const gameColors: Record<ThemeMode, GameColors> = {
  light: {
    gridCell: '#FFFFFF',
    gridBorder: '#E3DCCD',
    selection: 'rgba(31,95,175,0.35)',
    highlights: HUES,
    highlightAlpha: 0.55,
    onHighlight: '#1B1B1F',
    hintRing: '#B45309',
  },
  dark: {
    gridCell: '#262B31',
    gridBorder: '#3A4048',
    selection: 'rgba(127,179,255,0.4)',
    highlights: HUES,
    // The plan says 55% for dark too, but light letters on 55% pastel fall under AA; see contrast.test.ts.
    highlightAlpha: 0.32,
    onHighlight: '#F2F2F2',
    hintRing: '#FBBF24',
  },
  'high-contrast': {
    gridCell: '#000000',
    gridBorder: '#FFFFFF',
    selection: 'rgba(255,255,0,0.6)',
    highlights: ['#FFFF00', '#00FFFF'],
    highlightAlpha: 0,
    onHighlight: '#FFFFFF',
    hintRing: '#FFA500',
  },
};

/** Type scale per text-size setting, plan §7.2 (sp). */
export const textScale: Record<TextSize, { gridLetter: number; body: number; chip: number; button: number; title: number; display: number }> = {
  comfortable: { gridLetter: 22, body: 18, chip: 18, button: 20, title: 26, display: 34 },
  large: { gridLetter: 26, body: 20, chip: 20, button: 20, title: 28, display: 36 },
  xlarge: { gridLetter: 32, body: 22, chip: 24, button: 22, title: 30, display: 38 },
  huge: { gridLetter: 38, body: 24, chip: 26, button: 24, title: 32, display: 40 },
};

/** The shared theme scales its 16sp body, so this makes `type.body` match the plan's body size. */
export const fontScaleFor = (size: TextSize): number => textScale[size].body / 16;

/** Minimum grid cell per text size in dp (plan §8.1). */
export const minCellDp: Record<TextSize, number> = { comfortable: 44, large: 50, xlarge: 58, huge: 66 };

export const TEXT_SIZES: TextSize[] = ['comfortable', 'large', 'xlarge', 'huge'];

/** Minimum touch target for buttons and rows (plan §7.3). */
export const TOUCH_TARGET = 56;
