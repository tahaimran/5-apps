import { dayOfYear } from './dateKey';
import { generatePuzzle } from './generator';
import { DAILY_ROTATION, getPack } from './packs';
import { hash32 } from './prng';
import type { DailyState, DateKey, Difficulty, PackId, Puzzle, Stars } from './types';
import { dayDiff, addDays } from './dateKey';

export const dailyPuzzleId = (dateKey: DateKey, difficulty: Difficulty) => `daily:${dateKey}:${difficulty}`;

/** Plan §8.6: `seed = hash32('ws-daily-v1:' + dateKey)`. */
export const dailySeed = (dateKey: DateKey): number => hash32(`ws-daily-v1:${dateKey}`);

/** The theme of a day: `DAILY_ROTATION[dayOfYear % length]`. */
export const dailyPackId = (dateKey: DateKey): PackId => DAILY_ROTATION[dayOfYear(dateKey) % DAILY_ROTATION.length];

/**
 * The puzzle of a day. Everyone on the same difficulty and grid size gets the same one; the size
 * depends on the screen and text size (plan §8.1), so it is part of the seed.
 */
export function dailyPuzzle(dateKey: DateKey, difficulty: Difficulty, size: number): Puzzle {
  const packId = dailyPackId(dateKey);
  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown pack ${packId}`);
  return generatePuzzle({
    id: dailyPuzzleId(dateKey, difficulty),
    packId,
    difficulty,
    size,
    seed: hash32(`ws-daily-v1:${dateKey}:${size}`),
    words: pack.words,
  });
}

export interface DailyCompletion {
  state: DailyState;
  /** This completion counted toward the streak. */
  counted: boolean;
  /** A streak freeze covered one missed day. */
  freezeUsed: boolean;
  /** A 7-day streak earned a new freeze. */
  freezeEarned: boolean;
}

export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;

/**
 * Records a finished daily puzzle (plan §8.7). Only the puzzle of the current day (`dateKey === today`)
 * counts for the streak, and only when its date is after the last counted one, so setting the clock
 * back cannot award a day twice. A gap of exactly one missed day is bridged by a freeze if one is
 * held. Catch-up days keep their stars but never touch the streak.
 */
export function completeDaily(state: DailyState, dateKey: DateKey, today: DateKey, stars: Stars, now: number): DailyCompletion {
  const previous = state.completed[dateKey];
  const completed = {
    ...state.completed,
    [dateKey]: { stars: Math.max(previous?.stars ?? 0, stars) as Stars, at: previous?.at ?? now },
  };
  const last = state.lastDailyDateKey;
  if (dateKey !== today || (last !== undefined && dateKey <= last)) {
    return { state: { ...state, completed }, counted: false, freezeUsed: false, freezeEarned: false };
  }
  const gap = last === undefined ? null : dayDiff(last, dateKey);
  let streak = 1;
  let freezes = state.freezes;
  let freezeUsed = false;
  if (gap === 1) {
    streak = state.streak + 1;
  } else if (gap === 2 && freezes > 0) {
    freezes -= 1;
    freezeUsed = true;
    streak = state.streak + 1;
  }
  let freezeEarned = false;
  if (streak % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) {
    freezes += 1;
    freezeEarned = true;
  }
  return {
    state: { completed, streak, bestStreak: Math.max(state.bestStreak, streak), lastDailyDateKey: dateKey, freezes },
    counted: true,
    freezeUsed,
    freezeEarned,
  };
}

/** The streak to show today: it lapses after a missed day unless a freeze would cover it. */
export function effectiveStreak(state: DailyState, today: DateKey): number {
  const last = state.lastDailyDateKey;
  if (last === undefined) return 0;
  const gap = dayDiff(last, today);
  if (gap <= 1) return state.streak;
  if (gap === 2 && state.freezes > 0) return state.streak;
  return 0;
}

export type DayStatus = 'notStarted' | 'inProgress' | 'done';

/** Past days that can still be played as catch-up: not completed, newest first, within `window` days. */
export function catchUpDays(state: DailyState, today: DateKey, window = 7): DateKey[] {
  const out: DateKey[] = [];
  for (let i = 1; i <= window; i++) {
    const key = addDays(today, -i);
    if (!state.completed[key]) out.push(key);
  }
  return out;
}
