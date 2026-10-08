import type { DayKey, Habit, HabitId } from './types';
import { addDays, weekDays } from './dayKey';
import { isComplete } from './completion';
import { dayProgress } from './percent';
import { computeStreaks, type Entries } from './streaks';

type StatsHabit = Pick<Habit, 'id' | 'type' | 'target' | 'schedule' | 'createdAt' | 'archivedAt'>;

/** Days with a completed entry, including bonus days outside the schedule. */
export function totalCheckIns(habit: StatsHabit, entries: Entries): number {
  let n = 0;
  for (const [day, entry] of Object.entries(entries)) {
    if (day >= habit.createdAt && isComplete(habit, entry)) n++;
  }
  return n;
}

export interface DayBar {
  day: DayKey;
  done: number;
  total: number;
  /** 0..1, or 0 when nothing was scheduled. */
  ratio: number;
  isFuture: boolean;
}

/** One bar per day of the current week. */
export function weekBars(
  habits: StatsHabit[],
  entries: Record<HabitId, Entries>,
  today: DayKey,
  weekStartsOn: 0 | 1,
): DayBar[] {
  return weekDays(today, weekStartsOn).map((day) => {
    if (day > today) return { day, done: 0, total: 0, ratio: 0, isFuture: true };
    const { done, total } = dayProgress(habits, entries, day, weekStartsOn);
    return { day, done, total, ratio: total === 0 ? 0 : done / total, isFuture: false };
  });
}

export interface HabitSummary {
  habit: StatsHabit;
  current: number;
  best: number;
  unit: 'days' | 'weeks';
  total: number;
}

/** Per-habit summaries, longest current streak first (ties: best streak, then check-ins). */
export function summarize(
  habits: StatsHabit[],
  entries: Record<HabitId, Entries>,
  today: DayKey,
  weekStartsOn: 0 | 1,
): HabitSummary[] {
  return habits
    .filter((h) => !h.archivedAt)
    .map((habit) => {
      const e = entries[habit.id] ?? {};
      const s = computeStreaks(habit, e, today, weekStartsOn);
      return { habit, current: s.current, best: s.best, unit: s.unit, total: totalCheckIns(habit, e) };
    })
    .sort((a, b) => b.current - a.current || b.best - a.best || b.total - a.total);
}

export const totalAcross = (summaries: HabitSummary[]) => summaries.reduce((n, s) => n + s.total, 0);

/** Start of the 7-day window ending today (for "last 7 days" captions). */
export const sevenDaysAgo = (today: DayKey) => addDays(today, -6);
