import { addDays, dayRange } from './dayKey';
import type { DayKey, DaySummary, LogEntry } from './types';

export function summarizeDay(dayKey: DayKey, logs: LogEntry[], goalMl: number): DaySummary {
  const mine = logs.filter((l) => l.dayKey === dayKey);
  const effectiveMl = mine.reduce((sum, l) => sum + l.effectiveMl, 0);
  return { dayKey, effectiveMl, goalMl, count: mine.length, reached: goalMl > 0 && effectiveMl >= goalMl };
}

export interface ChartDay {
  dayKey: DayKey;
  effectiveMl: number;
  goalMl: number;
  reached: boolean;
  /** After today: drawn as an empty slot, left out of the stats. */
  future: boolean;
}

function chartDay(summaries: Record<DayKey, DaySummary>, dayKey: DayKey, today: DayKey, fallbackGoal: number): ChartDay {
  const s = summaries[dayKey];
  return {
    dayKey,
    effectiveMl: s?.effectiveMl ?? 0,
    goalMl: s?.goalMl ?? fallbackGoal,
    reached: s?.reached ?? false,
    future: dayKey > today,
  };
}

/** The 7 days ending on `endDay`. */
export function weekDays(summaries: Record<DayKey, DaySummary>, endDay: DayKey, today: DayKey, goalMl: number): ChartDay[] {
  return dayRange(addDays(endDay, -6), endDay).map((d) => chartDay(summaries, d, today, goalMl));
}

/** Every day of the calendar month `month` ('YYYY-MM'). */
export function monthDays(summaries: Record<DayKey, DaySummary>, month: string, today: DayKey, goalMl: number): ChartDay[] {
  const first = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const last = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  return dayRange(first, last).map((d) => chartDay(summaries, d, today, goalMl));
}

export interface RangeStats {
  averageMl: number;
  best: ChartDay | null;
  reachedDays: number;
  /** Days up to today in the range. */
  elapsedDays: number;
}

/** Average over the days up to today (zeros count), best day and goal-day count. */
export function rangeStats(days: ChartDay[]): RangeStats {
  const past = days.filter((d) => !d.future);
  const total = past.reduce((sum, d) => sum + d.effectiveMl, 0);
  const best = past.reduce<ChartDay | null>((b, d) => (d.effectiveMl > 0 && (!b || d.effectiveMl > b.effectiveMl) ? d : b), null);
  return {
    averageMl: past.length ? Math.round(total / past.length) : 0,
    best,
    reachedDays: past.filter((d) => d.reached).length,
    elapsedDays: past.length,
  };
}

export const shiftMonth = (month: string, delta: number): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
