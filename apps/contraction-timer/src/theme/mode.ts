import { sharedStore } from '@shared/storage';
import { useTheme } from '@shared/theme';
import type { ThemePref } from '@/domain/types';
import { db } from '@/store/storage';
import { appColors, NIGHT_SLOT, type AppColors } from './tokens';

type Stored = 'system' | 'light' | 'dark' | 'high-contrast';

/** The shared theme calls the night palette's slot `high-contrast`; this is the only place that knows. */
export const toStored = (pref: ThemePref): Stored => (pref === 'night' ? NIGHT_SLOT : pref);
export const fromStored = (stored: Stored | undefined): ThemePref => (stored === NIGHT_SLOT ? 'night' : (stored as ThemePref | undefined) ?? 'system');

export const getThemePref = (): ThemePref => fromStored(sharedStore.get('theme.mode'));

export function setThemePref(pref: ThemePref): void {
  sharedStore.set('theme.mode', toStored(pref));
}

/** The Timer header's one-tap Night switch: on, or back to what it was before. */
export function toggleNight(): ThemePref {
  const current = getThemePref();
  if (current === 'night') {
    const back = db.get('themeBeforeNight') ?? 'system';
    setThemePref(back === 'night' ? 'system' : back);
    return getThemePref();
  }
  db.set('themeBeforeNight', current);
  setThemePref('night');
  return 'night';
}

export const useThemePref = (): [ThemePref, (p: ThemePref) => void] => {
  const [stored] = sharedStore.useStored<'theme.mode'>('theme.mode', 'system');
  return [fromStored(stored), setThemePref];
};

/** The plan's extra tokens (Stop color, banner, divider) for the mode in use. */
export const useAppColors = (): AppColors => appColors[useTheme().mode];

export const useIsNight = (): boolean => useTheme().mode === NIGHT_SLOT;

/**
 * The fill for a small "this one" highlight (the current week pill, a round arrow button): teal with its
 * label color, except in Night, where a bright red fill would glare at 3am, so it is the dim dark red of
 * the Start button with red text.
 */
export function useStrongFill(): { bg: string; fg: string } {
  const { colors, mode } = useTheme();
  const app = appColors[mode];
  return mode === NIGHT_SLOT ? { bg: app.start[0], fg: app.onStart } : { bg: colors.primary, fg: colors.onPrimary };
}
