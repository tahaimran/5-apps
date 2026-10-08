import { monthDays, rangeStats, shiftMonth, summarizeDay, weekDays } from '../summaries';
import type { DaySummary, LogEntry } from '../types';

const log = (id: string, dayKey: string, effectiveMl: number): LogEntry => ({
  id,
  ts: 0,
  dayKey,
  beverage: 'water',
  volumeMl: effectiveMl,
  effectiveMl,
  source: 'app',
});
const sum = (dayKey: string, effectiveMl: number, goalMl = 2000): DaySummary => ({ dayKey, effectiveMl, goalMl, count: 1, reached: effectiveMl >= goalMl });

describe('summarizeDay', () => {
  it('adds the effective ml of the day and ignores other days', () => {
    const s = summarizeDay('2026-10-08', [log('a', '2026-10-08', 250), log('b', '2026-10-08', 200), log('c', '2026-10-07', 900)], 2000);
    expect(s).toEqual({ dayKey: '2026-10-08', effectiveMl: 450, goalMl: 2000, count: 2, reached: false });
  });
  it('reaches the goal exactly at the goal', () => {
    expect(summarizeDay('d', [log('a', 'd', 2000)], 2000).reached).toBe(true);
    expect(summarizeDay('d', [log('a', 'd', 1999)], 2000).reached).toBe(false);
  });
  it('is empty for a day without logs', () => {
    expect(summarizeDay('d', [], 2000)).toMatchObject({ effectiveMl: 0, count: 0, reached: false });
  });
});

describe('charts', () => {
  const summaries = Object.fromEntries([sum('2026-10-06', 2100), sum('2026-10-07', 1000), sum('2026-10-08', 1500)].map((s) => [s.dayKey, s]));
  it('lists the 7 days ending on a day, marking days after today as future', () => {
    const days = weekDays(summaries, '2026-10-10', '2026-10-08', 2000);
    expect(days.map((d) => d.dayKey)).toEqual(['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
    expect(days.map((d) => d.future)).toEqual([false, false, false, false, false, true, true]);
    expect(days[2]).toMatchObject({ effectiveMl: 2100, reached: true });
    expect(days[0]).toMatchObject({ effectiveMl: 0, goalMl: 2000, reached: false });
  });
  it('lists every day of a month, including a leap February', () => {
    expect(monthDays({}, '2026-10', '2026-10-08', 2000)).toHaveLength(31);
    expect(monthDays({}, '2028-02', '2028-02-10', 2000)).toHaveLength(29);
    expect(monthDays({}, '2026-02', '2026-02-10', 2000)).toHaveLength(28);
  });
  it('computes average over the elapsed days, the best day and goal days', () => {
    const stats = rangeStats(weekDays(summaries, '2026-10-08', '2026-10-08', 2000));
    expect(stats.elapsedDays).toBe(7);
    expect(stats.averageMl).toBe(Math.round(4600 / 7));
    expect(stats.best?.dayKey).toBe('2026-10-06');
    expect(stats.reachedDays).toBe(1);
  });
  it('leaves the future out of the statistics and has no best day without data', () => {
    const stats = rangeStats(weekDays({}, '2026-10-12', '2026-10-08', 2000));
    expect(stats.elapsedDays).toBe(3);
    expect(stats.best).toBeNull();
    expect(stats.averageMl).toBe(0);
    expect(rangeStats([])).toMatchObject({ averageMl: 0, elapsedDays: 0 });
  });
  it('shifts months across a year end', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-10', 0)).toBe('2026-10');
  });
});
