import { addDays, dayDiff } from './dateKey';
import type { DateKey, StreakState } from './types';

export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;
/** Plan §8: after a time-zone change, guard against more than one increment per 20 hours. */
export const TZ_GUARD_MS = 20 * 3_600_000;
export const RESTORE_MIN_STREAK = 3;

export interface StreakCompletion {
  state: StreakState;
  /** This completion moved the streak forward. */
  counted: boolean;
  /** A freeze covered exactly one missed day. */
  freezeUsed: boolean;
  /** A 7-day multiple earned a new freeze. */
  freezeEarned: boolean;
  /** Not counted because the clock's time zone changed less than 20 h after the last counted day. */
  blockedByTimeZone: boolean;
}

const unchanged = (state: StreakState, blocked = false): StreakCompletion => ({ state, counted: false, freezeUsed: false, freezeEarned: false, blockedByTimeZone: blocked });

/**
 * Records a finished Daily Challenge for `today` (plan §8). It counts when today is after the last
 * counted date, so setting the clock back cannot award a day twice. One missed day is bridged by a
 * freeze if one is held; a longer gap restarts at 1. Two counted days less than 20 h apart with a
 * different UTC offset (a time-zone change, not a late-night game) are not both counted.
 */
export function completeDailyStreak(state: StreakState, today: DateKey, nowMs: number, offsetMin: number): StreakCompletion {
  const last = state.lastDate;
  if (last !== null && dayDiff(last, today) <= 0) return unchanged(state);
  if (
    last !== null &&
    state.countedAtMs !== undefined &&
    state.countedOffsetMin !== undefined &&
    state.countedOffsetMin !== offsetMin &&
    nowMs - state.countedAtMs < TZ_GUARD_MS
  ) {
    return unchanged(state, true);
  }
  const gap = last === null ? null : dayDiff(last, today);
  let current = 1;
  let freezes = state.freezes;
  let freezeUsed = false;
  if (gap === 1) {
    current = state.current + 1;
  } else if (gap === 2 && freezes > 0) {
    freezes -= 1;
    freezeUsed = true;
    current = state.current + 1;
  }
  let freezeEarned = false;
  if (current % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) {
    freezes += 1;
    freezeEarned = true;
  }
  return {
    state: { ...state, current, best: Math.max(state.best, current), freezes, lastDate: today, countedAtMs: nowMs, countedOffsetMin: offsetMin },
    counted: true,
    freezeUsed,
    freezeEarned,
    blockedByTimeZone: false,
  };
}

/** The streak to show today: it lapses after a missed day unless a freeze would cover it. */
export function effectiveStreak(state: StreakState, today: DateKey): number {
  if (state.lastDate === null) return 0;
  const gap = dayDiff(state.lastDate, today);
  if (gap <= 1) return state.current;
  if (gap === 2 && state.freezes > 0) return state.current;
  return 0;
}

/** Plan §8: the rewarded "Restore streak" is offered once, if the streak was 3 or more and exactly one day was missed. */
export function canRestoreStreak(state: StreakState, today: DateKey): boolean {
  if (state.lastDate === null || state.current < RESTORE_MIN_STREAK) return false;
  if (dayDiff(state.lastDate, today) !== 2) return false;
  if (state.freezes > 0) return false; // a freeze covers it by itself
  return state.restoredAt !== state.lastDate;
}

/** Bridges the single missed day, so completing today's Daily continues the streak. */
export function restoreStreak(state: StreakState, today: DateKey): StreakState {
  if (!canRestoreStreak(state, today)) return state;
  return { ...state, restoredAt: state.lastDate ?? undefined, lastDate: addDays(today, -1) };
}

/** Home shows the amber "streak at risk" card from 18:00 when the Daily is not played and there is a streak (plan §5). */
export function streakAtRisk(state: StreakState, today: DateKey, hour: number, dailyPlayedToday: boolean): boolean {
  return !dailyPlayedToday && hour >= 18 && effectiveStreak(state, today) > 0;
}
