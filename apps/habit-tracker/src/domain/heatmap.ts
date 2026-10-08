import type { DayKey, Habit } from './types';
import { addDays, daysBetween, startOfWeek } from './dayKey';
import { completionRatio } from './completion';
import { isScheduledOn } from './schedule';
import type { Entries } from './streaks';

export type HeatLevel = 0 | 1 | 2 | 3 | 4;
export type CellState = 'before' | 'future' | 'unscheduled' | 'frozen' | 'value';

export interface HeatCell {
  day: DayKey;
  state: CellState;
  /** 0..1 progress for the day. */
  ratio: number;
  /** 0 = nothing logged, 1..4 = the habit color at 20/45/70/100%. */
  level: HeatLevel;
}

export const MIN_WEEKS = 20;
export const MAX_WEEKS = 53;
/** Opacity of the habit color per level. */
export const LEVEL_ALPHA = [0, 0.2, 0.45, 0.7, 1] as const;

export function levelFor(ratio: number): HeatLevel {
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 4;
  if (ratio > 2 / 3) return 3;
  if (ratio > 1 / 3) return 2;
  return 1;
}

/** Number of week columns: the last 20 weeks, growing back to the habit's first week (max 53). */
export function heatmapWeeks(createdAt: DayKey, today: DayKey, weekStartsOn: 0 | 1): number {
  const weeksSinceStart = daysBetween(startOfWeek(createdAt, weekStartsOn), startOfWeek(today, weekStartsOn)) / 7 + 1;
  return Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, weeksSinceStart));
}

/**
 * GitHub-style grid: one array per week (oldest first), 7 cells each (week start first).
 * Days before the habit started and in the future are inert; frozen days are ice-blue;
 * days the schedule skips are dimmed.
 */
export function buildHeatmap(
  habit: Pick<Habit, 'type' | 'target' | 'schedule' | 'createdAt'>,
  entries: Entries,
  today: DayKey,
  weekStartsOn: 0 | 1,
): HeatCell[][] {
  const weeks = heatmapWeeks(habit.createdAt, today, weekStartsOn);
  const firstWeek = addDays(startOfWeek(today, weekStartsOn), -(weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i): HeatCell => {
      const day = addDays(firstWeek, w * 7 + i);
      if (day > today) return { day, state: 'future', ratio: 0, level: 0 };
      if (day < habit.createdAt) return { day, state: 'before', ratio: 0, level: 0 };
      const entry = entries[day];
      const ratio = completionRatio(habit, entry);
      if (ratio === 0 && entry?.frozen) return { day, state: 'frozen', ratio: 0, level: 0 };
      if (ratio === 0 && !isScheduledOn(habit.schedule, day)) return { day, state: 'unscheduled', ratio: 0, level: 0 };
      return { day, state: 'value', ratio, level: levelFor(ratio) };
    }),
  );
}
