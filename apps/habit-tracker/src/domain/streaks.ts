import type { DayKey, Entry, Habit } from './types';
import { addDays, startOfWeek } from './dayKey';
import { isComplete } from './completion';
import { isScheduledOn } from './schedule';

export type Entries = Record<DayKey, Entry>;
export type StreakHabit = Pick<Habit, 'type' | 'target' | 'schedule' | 'createdAt'>;
export type DayStatus = 'complete' | 'frozen' | 'none';

export interface StreakResult {
  current: number;
  best: number;
  /** Per-week habits count weeks; the others count days. */
  unit: 'days' | 'weeks';
}

export function dayStatus(habit: StreakHabit, entries: Entries, day: DayKey): DayStatus {
  const entry = entries[day];
  if (isComplete(habit, entry)) return 'complete';
  return entry?.frozen ? 'frozen' : 'none';
}

/**
 * Run of consecutive successful scheduled days after walking every day from the start date up to
 * (not including) `end`. `inProgress` is a day that may still be completed and so never breaks
 * the streak. Days that are not scheduled and frozen days are transparent, and completing a
 * non-scheduled day is a bonus that does not extend the streak.
 */
function dayRun(habit: StreakHabit, entries: Entries, end: DayKey, inProgress: DayKey | null) {
  let run = 0;
  let best = 0;
  for (let d = habit.createdAt; d < end; d = addDays(d, 1)) {
    if (!isScheduledOn(habit.schedule, d)) continue;
    const status = dayStatus(habit, entries, d);
    if (status === 'complete') {
      run++;
      best = Math.max(best, run);
    } else if (status === 'none' && d !== inProgress) {
      run = 0;
    }
  }
  return { run, best };
}

/** Completions (including freezes) in the week containing `day`, up to and including `day`. */
export function weekCount(habit: StreakHabit, entries: Entries, day: DayKey, weekStartsOn: 0 | 1): number {
  let count = 0;
  for (let d = startOfWeek(day, weekStartsOn); d <= day; d = addDays(d, 1)) {
    if (d >= habit.createdAt && dayStatus(habit, entries, d) !== 'none') count++;
  }
  return count;
}

function weekRun(habit: StreakHabit, entries: Entries, today: DayKey, weekStartsOn: 0 | 1) {
  if (habit.schedule.kind !== 'perWeek') return { run: 0, best: 0 };
  const { times } = habit.schedule;
  const currentWeek = startOfWeek(today, weekStartsOn);
  let run = 0;
  let best = 0;
  for (let w = startOfWeek(habit.createdAt, weekStartsOn); w <= currentWeek; w = addDays(w, 7)) {
    const through = w === currentWeek ? today : addDays(w, 6);
    if (weekCount(habit, entries, through, weekStartsOn) >= times) {
      run++;
      best = Math.max(best, run);
    } else if (w !== currentWeek) {
      run = 0;
    }
  }
  return { run, best };
}

export function computeStreaks(
  habit: StreakHabit,
  entries: Entries,
  today: DayKey,
  weekStartsOn: 0 | 1 = 1,
): StreakResult {
  if (habit.schedule.kind === 'perWeek') {
    const { run, best } = weekRun(habit, entries, today, weekStartsOn);
    return { current: run, best, unit: 'weeks' };
  }
  const { run, best } = dayRun(habit, entries, addDays(today, 1), today);
  return { current: run, best, unit: 'days' };
}

/** Day streak that would be broken by missing `day` (used to decide whether a freeze helps). */
export function streakBefore(habit: StreakHabit, entries: Entries, day: DayKey): number {
  if (habit.schedule.kind === 'perWeek') return 0;
  return dayRun(habit, entries, day, null).run;
}
