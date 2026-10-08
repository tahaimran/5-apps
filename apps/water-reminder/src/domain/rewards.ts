import { MAX_FREEZES } from './streak';
import type { DayKey, PlantProgress, Prefs } from './types';
import { cupThemes, skins, type ShopItem } from '../data/shop';

/** Plan §12: at most 10 rewarded unlocks and 1 freeze earned per day. */
export const MAX_UNLOCKS_PER_DAY = 10;

export type FreezeBlock = 'full' | 'today';

/** Why a streak freeze cannot be earned right now, or null if it can. */
export function freezeBlock(progress: Pick<PlantProgress, 'streakFreezes'>, prefs: Pick<Prefs, 'freezeEarnedDay'>, today: DayKey): FreezeBlock | null {
  if (progress.streakFreezes >= MAX_FREEZES) return 'full';
  if (prefs.freezeEarnedDay === today) return 'today';
  return null;
}

export const unlocksLeftToday = (prefs: Pick<Prefs, 'unlocksToday'>, today: DayKey): number =>
  Math.max(0, MAX_UNLOCKS_PER_DAY - (prefs.unlocksToday?.day === today ? prefs.unlocksToday.count : 0));

export type ShopKind = 'skin' | 'cup';
export const catalog = (kind: ShopKind): ShopItem[] => (kind === 'skin' ? skins : cupThemes);
export const unlockKey = (kind: ShopKind, id: string) => `${kind}:${id}`;

/** An item is usable if it is free, was unlocked with an ad, or the best streak has reached its milestone. */
export function isUnlocked(kind: ShopKind, item: ShopItem, progress: Pick<PlantProgress, 'unlocked' | 'bestStreak'>): boolean {
  if (item.unlock.kind === 'free') return true;
  if (item.unlock.kind === 'streak') return progress.bestStreak >= item.unlock.days;
  return progress.unlocked.includes(unlockKey(kind, item.id));
}

export const activeId = (kind: ShopKind, progress: Pick<PlantProgress, 'activeSkin' | 'activeCupTheme'>): string =>
  kind === 'skin' ? progress.activeSkin : progress.activeCupTheme;
