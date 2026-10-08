/** Checklist §18 "no jank on Today with 30 habits": the per-render work stays small. */
import { addDays } from '../dayKey';
import { dayProgress } from '../percent';
import { buildHeatmap } from '../heatmap';
import { planNotifications } from '../notificationPlan';
import { summarize } from '../stats';
import { computeStreaks, type Entries } from '../streaks';
import { buildSnapshot } from '../widgetSnapshot';
import type { Habit, Schedule } from '../types';
import { d, habit } from '../testHelpers';

const TODAY = d('2026-10-08');
const START = d('2025-10-08');

function fixture(count: number) {
  const habits: Habit[] = [];
  const entries: Record<string, Entries> = {};
  for (let i = 0; i < count; i++) {
    const schedule: Schedule = i % 3 === 0 ? { kind: 'daily' } : i % 3 === 1 ? { kind: 'weekdays', days: [1, 2, 3, 4, 5] } : { kind: 'perWeek', times: 3 };
    const h = habit({ id: `h${i}`, schedule, createdAt: START, reminders: [{ time: '18:00', notifIds: [] }] });
    habits.push(h);
    const e: Entries = {};
    for (let day = 0; day < 365; day++) if ((day + i) % 4 !== 0) e[addDays(START, day)] = { value: 1, updatedAt: 0 };
    entries[h.id] = e;
  }
  return { habits, entries };
}

const time = (fn: () => void, runs = 5) => {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  return Math.min(...times);
};

describe('30 habits with a year of history', () => {
  const { habits, entries } = fixture(30);
  // Generous ceilings: the point is catching an accidental O(n^2), not micro-benchmarking.
  it('computes every streak for the Today list quickly', () => {
    expect(time(() => habits.forEach((h) => computeStreaks(h, entries[h.id], TODAY, 1)))).toBeLessThan(150);
  });
  it('computes the progress ring and week strip quickly', () => {
    expect(time(() => { for (let i = 0; i < 7; i++) dayProgress(habits, entries, addDays(TODAY, -i), 1); })).toBeLessThan(100);
  });
  it('builds the Stats summaries quickly', () => {
    expect(time(() => summarize(habits, entries, TODAY, 1))).toBeLessThan(200);
  });
  it('builds a year heatmap quickly', () => {
    expect(time(() => buildHeatmap(habits[0], entries.h0, TODAY, 1))).toBeLessThan(50);
  });
  it('plans a week of notifications within budget quickly', () => {
    const plan = planNotifications({
      habits, entries, now: new Date(2026, 9, 8, 10), dayEndsAtHour: 0, weekStartsOn: 1,
      dailySummary: { enabled: true, time: '08:00' }, eveningNudge: { enabled: true, time: '20:30' },
    });
    expect(plan.length).toBeLessThanOrEqual(64);
    expect(time(() => planNotifications({ habits, entries, now: new Date(2026, 9, 8, 10), dayEndsAtHour: 0, weekStartsOn: 1, dailySummary: { enabled: true, time: '08:00' }, eveningNudge: { enabled: true, time: '20:30' } }))).toBeLessThan(300);
  });
  it('builds the widget snapshot quickly (it runs on every change)', () => {
    const map = Object.fromEntries(habits.map((h) => [h.id, h]));
    expect(time(() => buildSnapshot({ habits: map, habitOrder: habits.map((h) => h.id), entries, day: TODAY, weekStartsOn: 1, theme: 'light', now: 0 }))).toBeLessThan(150);
  });
});
