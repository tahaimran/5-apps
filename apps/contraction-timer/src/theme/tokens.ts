import type { Palette, ThemeMode } from '@shared/theme';
import type { ThemePref } from '@/domain/types';

/**
 * Palette from DEVELOPMENT_PLAN.md §7. @shared/theme has three modes (light, dark, high-contrast) and no
 * night mode, so the app keeps its red-shifted night palette in the `high-contrast` slot. The mapping lives
 * here and in `src/theme/mode.ts` only; nothing else should look at the raw mode name.
 *
 * Where the plan's colors fall below WCAG AA (see theme/__tests__/contrast.test.ts) they are adjusted and
 * the change is listed in RELEASE.md: white on the teal Start button (3.3:1) became dark ink, the night
 * secondary text and the control borders were lightened.
 */
export const NIGHT_SLOT: ThemeMode = 'high-contrast';

export const palette: Partial<Record<ThemeMode, Partial<Palette>>> = {
  light: {
    background: '#FBF7F4',
    surface: '#FFFFFF',
    surfaceAlt: '#F3ECE6',
    text: '#2B2D42',
    textMuted: '#5F6374',
    border: '#8A8EA0',
    primary: '#3E9C95',
    onPrimary: '#0B1F24',
    accent: '#9B8EC4',
    success: '#2F7A3E',
    danger: '#B3261E',
  },
  dark: {
    background: '#141519',
    surface: '#1E2026',
    surfaceAlt: '#272A32',
    text: '#ECEDF2',
    textMuted: '#A3A7B7',
    border: '#6A6F80',
    primary: '#5BBFB7',
    onPrimary: '#141519',
    accent: '#B5AAE0',
    success: '#86C590',
    danger: '#FF8A80',
  },
  // Night: red only, pure black background (OLED). No blue and little green.
  'high-contrast': {
    background: '#000000',
    surface: '#120404',
    surfaceAlt: '#1E0807',
    text: '#FF6B5A',
    textMuted: '#D65A4B',
    border: '#B83D2F',
    primary: '#8C1E14',
    onPrimary: '#FF8272',
    accent: '#5A1810',
    success: '#E8806E',
    danger: '#FFA090',
  },
};

/** Tokens the shared palette has no slot for (plan §7 table). */
export interface AppColors {
  /** The Stop button and the "contracting" state. */
  active: string;
  onActive: string;
  /** The soft banner for the pattern message. */
  alertBg: string;
  alertText: string;
  divider: string;
}

export const appColors: Record<ThemeMode, AppColors> = {
  light: { active: '#E07A5F', onActive: '#2B2D42', alertBg: '#F2C46D', alertText: '#5C4300', divider: '#ECE4DE' },
  dark: { active: '#F09A82', onActive: '#141519', alertBg: '#4A3A12', alertText: '#F7D893', divider: '#2C2F38' },
  'high-contrast': { active: '#D2321F', onActive: '#FFE3DD', alertBg: '#3A0A05', alertText: '#FF6B5A', divider: '#2A0804' },
};

/** Plan §7: body text is 18sp; the shared scale is 16sp, so this multiplier makes `type.body` match. */
export const FONT_SCALE = 18 / 16;
/** Partner mode scales the Timer screen's type by this much (plan §7). */
export const PARTNER_SCALE = 1.4;
/** Minimum touch target in dp: this is a maternity app (CLAUDE.md rule 7). */
export const TOUCH_TARGET = 56;

/** Timer button sizes in dp (plan §7: at least 120, 220 by default, hit slop +24). */
export const TIMER_BUTTON = { min: 120, default: 220, partner: 280, hitSlop: 24 } as const;
export const KICK_BUTTON = 180;

/** The digits of the running timer in sp (plan §7 type scale: display 72/80). */
export const DIGITS = { size: 72, line: 80 } as const;

export const THEME_PREFS: ThemePref[] = ['system', 'light', 'dark', 'night'];
