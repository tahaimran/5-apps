import type { FontFamilies, Palette, ThemeMode } from '@shared/theme';
import type { ThemePref } from '@/domain/types';

/**
 * "Dawn" (DEVELOPMENT_PLAN.md §7): a cream page with a faint mint-to-blush wash, white cards with warm
 * shadows, and colors that keep one meaning each: teal = Start, coral = Stop / contracting, soft amber =
 * the pattern banner and every other "heads up". Nothing outside Night is red.
 *
 * @shared/theme has three modes (light, dark, high-contrast) and no night mode, so the red-shifted night
 * palette lives in the `high-contrast` slot. The mapping lives here and in `src/theme/mode.ts` only.
 * Every pair is checked in theme/__tests__/contrast.test.ts; every Night value in night.test.ts.
 */
export const NIGHT_SLOT: ThemeMode = 'high-contrast';

export const palette: Record<ThemeMode, Palette> = {
  light: {
    background: '#FBF6F2',
    surface: '#FFFFFF',
    surfaceAlt: '#F3ECE7',
    text: '#2A2B3D',
    textMuted: '#5D6073',
    border: '#857C76',
    primary: '#25756F',
    onPrimary: '#FFFFFF',
    primarySoft: '#E0F2EF',
    accent: '#6E5DAA',
    success: '#2F7A4A',
    danger: '#9C4A3C',
    shadow: '#6B5040',
  },
  dark: {
    background: '#121419',
    surface: '#1C1F26',
    surfaceAlt: '#272B34',
    text: '#EEEDF3',
    textMuted: '#A9ABBA',
    border: '#707588',
    primary: '#5EC4BA',
    onPrimary: '#0D2422',
    primarySoft: '#18332F',
    accent: '#B5AAE0',
    success: '#86C590',
    danger: '#F0A08C',
    shadow: '#000000',
  },
  // Night: red only on pure black (OLED). No blue or green channel above 30%.
  'high-contrast': {
    background: '#000000',
    surface: '#140403',
    surfaceAlt: '#220806',
    text: '#FF4A3A',
    textMuted: '#E04A39',
    border: '#B3301F',
    primary: '#E5402F',
    onPrimary: '#000000',
    primarySoft: '#220604',
    accent: '#B3301F',
    success: '#FF4A3A',
    danger: '#FF4A3A',
    shadow: '#000000',
  },
};

/** Embedded by the expo-font plugin in app.config.ts. */
export const fonts: FontFamilies = { body: 'Figtree', display: 'Bricolage' };

type Pair = readonly [string, string];
type Trio = readonly [string, string, string];

/** Tokens the shared palette has no slot for (plan §7 "App tokens"). */
export interface AppColors {
  /** Coral: the "contracting" state wherever it shows up outside the button (status dot, row marks). */
  active: string;
  onActive: string;
  /** Coral as text or an icon on light surfaces, and its soft tint (the average-length tile, contracting marks). */
  activeText: string;
  activeSoft: string;
  /** The giant button: a teal disc to start, a coral one to stop. Labels sit on both gradient stops. */
  start: Pair;
  onStart: string;
  stop: Pair;
  onStop: string;
  /** The ring that breathes around the button while a contraction runs, and the still ring around it. */
  ring: string;
  track: string;
  /** The page wash behind the Timer, top to bottom: resting and contracting (they crossfade). */
  wash: Trio;
  washActive: Trio;
  /** The soft amber card: pattern banner, long contraction, idle prompt, kick 2-hour message. */
  alertBg: string;
  alertText: string;
  alertIcon: string;
  divider: string;
  /** The Kicks stage, its text, and the counter ring on it. */
  kickStage: Pair;
  onKick: string;
  kickTrack: string;
  kickRing: string;
  /** The counter disc on the stage (a raised white disc in light mode). */
  kickDisc: string;
  onKickDisc: string;
  /** The My Pregnancy hero card. */
  hero: Pair;
  onHero: string;
  heroMuted: string;
  heroTrack: string;
  heroRing: string;
  /** A frosted layer on a stage (chips, secondary buttons on Kicks), drawn over the stage gradient. */
  frost: string;
  /** The dim layer behind a sheet. */
  scrim: string;
  /** The soft highlight across the top of the giant button. */
  sheen: string;
}

/** A frosted overlay as #RRGGBBAA. The contrast test blends it over the lightest stage stop. */
export const FROST_ALPHA = { light: 0.14, dark: 0.14, night: 0.14 } as const;
const withAlpha = (hex: string, alpha: number) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase()}`;

export const appColors: Record<ThemeMode, AppColors> = {
  light: {
    active: '#E07A5F',
    onActive: '#2A2B3D',
    activeText: '#A9503B',
    activeSoft: '#FCE9E3',
    start: ['#2A8079', '#1B5C57'],
    onStart: '#FFFFFF',
    stop: ['#DB6E53', '#BF5641'],
    onStop: '#FFFFFF',
    ring: '#C9654B',
    track: '#D9E9E5',
    wash: ['#DDF1ED', '#FBF6F2', '#F9E9EC'],
    washActive: ['#FBE3D9', '#FBF6F2', '#F9E9EC'],
    alertBg: '#FBE7B8',
    alertText: '#6B4A00',
    alertIcon: '#8A5E00',
    divider: '#ECE4DE',
    kickStage: ['#65559F', '#4C3F86'],
    onKick: '#FFFFFF',
    kickTrack: withAlpha('#FFFFFF', 0.28),
    kickRing: '#FFFFFF',
    kickDisc: '#FFFFFF',
    onKickDisc: '#4A3D85',
    hero: ['#CDEDE7', '#F8E2E9'],
    onHero: '#2A2B3D',
    heroMuted: '#4E5165',
    heroTrack: withAlpha('#FFFFFF', 0.7),
    heroRing: '#25756F',
    frost: withAlpha('#FFFFFF', FROST_ALPHA.light),
    scrim: '#1E15128C',
    sheen: withAlpha('#FFFFFF', 0.22),
  },
  dark: {
    active: '#F09A82',
    onActive: '#121419',
    activeText: '#F09A82',
    activeSoft: '#3A221E',
    start: ['#2A8079', '#1B5C57'],
    onStart: '#FFFFFF',
    stop: ['#C9624A', '#A64A37'],
    onStop: '#FFFFFF',
    ring: '#F09A82',
    track: '#23383A',
    wash: ['#14302E', '#121419', '#121419'],
    washActive: ['#3A221E', '#121419', '#121419'],
    alertBg: '#3D3112',
    alertText: '#F5D88C',
    alertIcon: '#F5D88C',
    divider: '#2C2F38',
    kickStage: ['#5B4C96', '#3F336F'],
    onKick: '#FFFFFF',
    kickTrack: withAlpha('#FFFFFF', 0.2),
    kickRing: '#E2DBFF',
    // Raised above the stage (lighter), like every raised layer in dark mode.
    kickDisc: '#6E5FAE',
    onKickDisc: '#FFFFFF',
    hero: ['#1B3A37', '#3A2430'],
    onHero: '#EEEDF3',
    heroMuted: '#C2C4D0',
    heroTrack: withAlpha('#FFFFFF', 0.16),
    heroRing: '#5EC4BA',
    frost: withAlpha('#FFFFFF', FROST_ALPHA.dark),
    scrim: '#0000009E',
    sheen: withAlpha('#FFFFFF', 0.12),
  },
  'high-contrast': {
    active: '#FF4A3A',
    onActive: '#000000',
    activeText: '#FF4A3A',
    activeSoft: '#2A0805',
    start: ['#4A0E07', '#2E0603'],
    onStart: '#FF4A3A',
    stop: ['#6E140A', '#4A0E07'],
    onStop: '#FF4A3A',
    ring: '#FF4A3A',
    track: '#2A0805',
    wash: ['#120302', '#000000', '#000000'],
    washActive: ['#2A0703', '#000000', '#000000'],
    alertBg: '#2A0703',
    alertText: '#FF4A3A',
    alertIcon: '#FF4A3A',
    divider: '#2A0804',
    kickStage: ['#2E0603', '#1A0302'],
    onKick: '#FF4A3A',
    kickTrack: '#3D0A05',
    kickRing: '#FF4A3A',
    kickDisc: '#3D0A05',
    onKickDisc: '#FF4A3A',
    hero: ['#1A0402', '#0D0201'],
    onHero: '#FF4A3A',
    heroMuted: '#E04A39',
    heroTrack: '#3D0A05',
    // Dimmer than the text red: the dial's arc runs all the way round a big circle at 3am.
    heroRing: '#D2321F',
    frost: withAlpha('#FF4A3A', FROST_ALPHA.night),
    scrim: '#000000B3',
    sheen: withAlpha('#FF4A3A', 0.08),
  },
};

/** Plan §7: body text is 18sp; the shared scale is 16sp, so this multiplier makes `type.body` match. */
export const FONT_SCALE = 18 / 16;
/** Partner mode scales the Timer screen's type by this much (plan §7)... */
export const PARTNER_SCALE = 1.4;
/** ...but Partner × the phone's font scale never passes this (plan §7: "capped by system font scale ≤ 2.0"). */
export const MAX_COMBINED_SCALE = 2;
/** The Partner multiplier to use at the phone's font scale `system` (1.4 at 100%, 1 from 200% up). */
export const partnerFactor = (system: number): number => Math.max(1, Math.min(PARTNER_SCALE, MAX_COMBINED_SCALE / Math.max(system, 0.1)));

/** Minimum touch target in dp: this is a maternity app (CLAUDE.md rule 7). */
export const TOUCH_TARGET = 56;

/** Timer button sizes in dp (plan §7: at least 120, 220 by default, hit slop +24). */
export const TIMER_BUTTON = { min: 120, default: 220, partner: 280, hitSlop: 24 } as const;
export const KICK_BUTTON = 180;

/** The digits of the running timer in sp (plan §7 type scale: display 72/80). */
export const DIGITS = { size: 72, line: 80 } as const;

export const THEME_PREFS: ThemePref[] = ['system', 'light', 'dark', 'night'];

/** Everything the app passes to every ThemeProvider (the root, and the Timer's Partner-mode one). */
export const themeProps = { palette, fonts, touchTarget: TOUCH_TARGET } as const;

/**
 * The compact tab bar above the system gesture area: icons and labels in 56dp (like Habits), growing
 * with the phone's font scale so the labels never clip (70dp at 200%).
 */
export const tabBarHeight = (fontScale: number): number => Math.round(42 + 14 * Math.max(1, fontScale));
