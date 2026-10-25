import type { FontFamilies, Palette, ThemeMode } from '@shared/theme';
import type { TextSize } from '@/domain/types';

/**
 * "Sky Garden" (DEVELOPMENT_PLAN.md §7): a soft sky page with clouds, white boards with a deep-blue
 * frame, gold ribbons for titles, and a lime "go" button for the one move that starts or continues
 * play. Deep blue stays the brand and the color of every selected state; red is never used for
 * "wrong". Dark is a night sky; high contrast is black, white and yellow only (AAA, plan §7.1).
 * Every pair is checked in theme/__tests__/contrast.test.ts, every high-contrast value in highContrast.test.ts.
 */
export const palette: Record<ThemeMode, Palette> = {
  light: {
    background: '#EAF6FC',
    surface: '#FFFFFF',
    surfaceAlt: '#E1F0F8',
    text: '#13233F',
    textMuted: '#3C4A63',
    border: '#6A7F9C',
    primary: '#1F5FAF',
    onPrimary: '#FFFFFF',
    primarySoft: '#D6E8FA',
    accent: '#A85A00',
    success: '#2E7D32',
    danger: '#B3261E',
    shadow: '#1D4E7A',
  },
  dark: {
    background: '#0D1B2E',
    surface: '#16283F',
    surfaceAlt: '#1F3452',
    text: '#F1F5FB',
    textMuted: '#C3CEDD',
    border: '#6C82A3',
    primary: '#8EC0FF',
    onPrimary: '#0B1A2E',
    primarySoft: '#1C3557',
    accent: '#FFC857',
    success: '#8BD48F',
    danger: '#FF8A80',
    shadow: '#000000',
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
    primarySoft: '#000000',
    accent: '#FFA500',
    success: '#00FF00',
    danger: '#FFA500',
    shadow: '#000000',
  },
};

/**
 * Embedded by the expo-font plugin in app.config.ts. Figtree for the interface, Bricolage for titles and
 * big numbers (as in the other apps), and Atkinson Hyperlegible for the grid letters and the word list:
 * it was drawn for low vision (open shapes, distinct I/l/1, O/0), which is this app's promise.
 */
export const fonts: FontFamilies = { body: 'Figtree', display: 'Bricolage' };
export const GRID_FONT = 'Atkinson';

type Pair = readonly [string, string];
type Trio = readonly [string, string, string];

/** Tokens the shared palette has no slot for. */
export interface AppColors {
  /** The sky behind every screen, top to bottom. */
  stage: Trio;
  /** Clouds on the sky (with alpha), and the far and near hills of the Home scene. */
  cloud: string;
  hills: Pair;
  /** The sun on light sky, the moon on the night sky. */
  sun: string;
  /** Little stars on the night sky (transparent where there are none). */
  sparkle: string;
  /** Gold title ribbons: face, folded tails, and the text on them. */
  ribbon: string;
  ribbonShade: string;
  onRibbon: string;
  /** The frame around the letter grid. */
  board: string;
  /** The lime "go" button (Play, Continue, Next puzzle): gradient, the 3D lip under it, its label. */
  go: Pair;
  goLip: string;
  onGo: string;
  /** The lip under the white secondary game button. */
  lip: string;
  /** Stars and the hint disc: gold fill, its darker edge, an empty star. */
  gold: string;
  goldEdge: string;
  onGold: string;
  starEmpty: string;
  /** The streak flame. */
  flame: string;
  /** A frosted card over the sky. */
  frost: string;
  /** The rays behind the stars on Puzzle Complete. */
  burst: string;
  scrim: string;
  divider: string;
}

const withAlpha = (hex: string, alpha: number) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase()}`;

export const appColors: Record<ThemeMode, AppColors> = {
  light: {
    stage: ['#BFE6F8', '#DDF2FB', '#F2FAFD'],
    cloud: withAlpha('#FFFFFF', 0.92),
    hills: ['#B9E0A0', '#93CC74'],
    sun: '#FFD873',
    sparkle: '#FFFFFF00',
    ribbon: '#FFC93C',
    ribbonShade: '#E0A21C',
    onRibbon: '#4A2C00',
    board: '#1D4F8F',
    go: ['#8BD449', '#6CBF3A'],
    goLip: '#4C8F22',
    onGo: '#143D00',
    lip: '#B7CBE0',
    gold: '#FFC93C',
    goldEdge: '#C98A00',
    onGold: '#4A2C00',
    starEmpty: '#C8D6E5',
    flame: '#E0591F',
    frost: withAlpha('#FFFFFF', 0.86),
    burst: withAlpha('#FFFFFF', 0.55),
    scrim: '#0B1A2E8C',
    divider: '#DCE8F2',
  },
  dark: {
    stage: ['#0B1F3A', '#102845', '#0D1B2E'],
    cloud: withAlpha('#FFFFFF', 0.06),
    hills: ['#16304A', '#1B3A56'],
    sun: '#F4E7B0',
    sparkle: withAlpha('#FFFFFF', 0.7),
    ribbon: '#E9B23A',
    ribbonShade: '#B9861C',
    onRibbon: '#2A1A00',
    board: '#4A7CC0',
    go: ['#6DB043', '#5E9E3A'],
    goLip: '#3A6B22',
    onGo: '#0E2600',
    lip: '#0A1626',
    gold: '#FFC857',
    goldEdge: '#B9861C',
    onGold: '#2A1A00',
    starEmpty: '#3A5070',
    flame: '#FF9A5C',
    frost: withAlpha('#16283F', 0.9),
    burst: withAlpha('#FFFFFF', 0.08),
    scrim: '#000000A6',
    divider: '#26405F',
  },
  'high-contrast': {
    stage: ['#000000', '#000000', '#000000'],
    cloud: '#00000000',
    hills: ['#000000', '#000000'],
    sun: '#FFFF00',
    sparkle: '#00000000',
    ribbon: '#000000',
    ribbonShade: '#000000',
    onRibbon: '#FFFF00',
    board: '#FFFFFF',
    go: ['#000000', '#000000'],
    goLip: '#FFFF00',
    onGo: '#FFFF00',
    lip: '#FFFFFF',
    gold: '#FFFF00',
    goldEdge: '#FFFF00',
    onGold: '#000000',
    starEmpty: '#FFFFFF',
    flame: '#FFA500',
    frost: '#000000',
    burst: '#00000000',
    scrim: '#000000CC',
    divider: '#FFFFFF',
  },
};

export interface GameColors {
  gridCell: string;
  gridBorder: string;
  /** The live selection pill while a finger is on the grid (already with alpha), and its edge. */
  selection: string;
  selectionEdge: string;
  /** Found-word pills in rotation: a fill and an edge each; high contrast draws outlines only. */
  highlights: readonly string[];
  edges: readonly string[];
  /** Fill alpha for the pills (0 in high contrast: outline only). */
  highlightAlpha: number;
  /** Letters on a found pill. */
  onHighlight: string;
  hintRing: string;
}

export const gameColors: Record<ThemeMode, GameColors> = {
  light: {
    gridCell: '#FFFFFF',
    gridBorder: '#E3ECF4',
    selection: 'rgba(31,95,175,0.28)',
    selectionEdge: '#1F5FAF',
    // Coral, sky, lime, rose, lavender, gold: solid pastels under dark letters, each with a darker edge
    // that is at least 3:1 against the white cell, so a found word shows even to color-blind eyes.
    highlights: ['#FFAE94', '#9FD8F5', '#B8E38A', '#F9AFC9', '#CDB6F0', '#FFD45E'],
    edges: ['#D2593A', '#2A86BD', '#4B8F22', '#C4417A', '#7C5BC4', '#A87400'],
    highlightAlpha: 1,
    onHighlight: '#13233F',
    hintRing: '#A85A00',
  },
  dark: {
    gridCell: '#1A2D47',
    gridBorder: '#26405F',
    selection: 'rgba(142,192,255,0.32)',
    selectionEdge: '#8EC0FF',
    // Deep jewel fills under light letters, with the plan's bright hues as the edges.
    highlights: ['#6E3426', '#1F4E6B', '#2F5A1E', '#6B2846', '#4A3880', '#6B5200'],
    edges: ['#F4A261', '#8ECAE6', '#B5E48C', '#F7B2BD', '#CDB4DB', '#FFD166'],
    highlightAlpha: 1,
    onHighlight: '#F1F5FB',
    hintRing: '#FFC857',
  },
  'high-contrast': {
    gridCell: '#000000',
    gridBorder: '#FFFFFF',
    selection: 'rgba(255,255,0,0.6)',
    selectionEdge: '#FFFF00',
    highlights: ['#FFFF00', '#00FFFF'],
    edges: ['#FFFF00', '#00FFFF'],
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

/** Minimum touch target for buttons and rows (plan §7.3), and the primary game buttons. */
export const TOUCH_TARGET = 56;
export const PRIMARY_TARGET = 64;

/** Everything the app passes to the ThemeProvider (the font scale follows the text-size setting). */
export const themeProps = { palette, fonts, touchTarget: TOUCH_TARGET } as const;

/** Tab labels follow the letter-size setting like the rest of the text (caption + 2sp). */
export const tabLabelSize = (textSize: TextSize): number => Math.round(13 * fontScaleFor(textSize)) + 2;

/** Compact tab bar like Habits: the icon pill and a label line, growing with the label size and the phone's font scale. */
export const tabBarHeight = (fontScale: number, textSize: TextSize = 'large'): number =>
  Math.round(42 + Math.round(tabLabelSize(textSize) * 1.25) * Math.max(1, fontScale));
