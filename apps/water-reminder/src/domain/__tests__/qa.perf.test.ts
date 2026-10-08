/**
 * Computation budgets with years of data. They cover the pure logic only; scrolling and startup on
 * a mid-range phone are device checks (see RELEASE.md). Budgets are generous so a busy CI box passes.
 */
import { buildBackup, parseBackup } from '../backup';
import { addDays, dayKeyFor, monthKeyOf } from '../dayKey';
import { defaultBeverages } from '../hydration';
import { defaultCups, defaultGoal, defaultPrefs, defaultProfile, defaultProgress, defaultReminders } from '../defaults';
import { planReminders } from '../reminderPlan';
import { evaluateDays } from '../streak';
import { monthDays, rangeStats, summarizeDay, weekDays } from '../summaries';
import type { DaySummary, LogEntry } from '../types';

const START = '2022-01-01';
const DAYS = 365 * 4;

function makeYears() {
  const logs: Record<string, LogEntry[]> = {};
  const summaries: Record<string, DaySummary> = {};
  for (let i = 0; i < DAYS; i++) {
    const day = addDays(START, i);
    const entries: LogEntry[] = [];
    for (let k = 0; k < 8; k++) {
      const ts = new Date(`${day}T0${(k % 2) + 7}:00:00`).getTime() + k * 3_600_000;
      entries.push({ id: `${day}_${k}`, ts, dayKey: day, beverage: k % 3 === 0 ? 'coffee' : 'water', volumeMl: 300, effectiveMl: k % 3 === 0 ? 240 : 300, source: 'app' });
    }
    (logs[monthKeyOf(day)] ??= []).push(...entries);
    summaries[day] = summarizeDay(day, entries, 2000);
  }
  return { logs, summaries };
}

const time = <T>(fn: () => T): [T, number] => {
  const t0 = performance.now();
  const value = fn();
  return [value, performance.now() - t0];
};

describe('four years of data (11,680 drinks)', () => {
  const { logs, summaries } = makeYears();
  const today = addDays(START, DAYS);

  it('closes a year of missed days into the streak quickly', () => {
    const [r, ms] = time(() => evaluateDays({ ...defaultProgress(START), lastEvaluatedDay: START }, summaries, today));
    expect(r.progress.goalDays).toBe(400); // only the last 400 days are replayed (older gaps count as one miss)
    expect(ms).toBeLessThan(500);
  });
  it('builds the week and month charts instantly', () => {
    const [, ms] = time(() => {
      for (let i = 0; i < 200; i++) {
        rangeStats(weekDays(summaries, addDays(today, -i), today, 2000));
        rangeStats(monthDays(summaries, monthKeyOf(addDays(today, -i * 7)), today, 2000));
      }
    });
    expect(ms).toBeLessThan(500);
  });
  it('plans three days of reminders in a few milliseconds', () => {
    const [, ms] = time(() => {
      for (let i = 0; i < 200; i++) planReminders({ now: new Date(2026, 9, 8, 10, i % 60), reminders: defaultReminders, goalMl: 2300, cupMl: 250, logTimes: [], todayReached: false });
    });
    expect(ms / 200).toBeLessThan(25);
  });
  it('exports and re-imports the whole history', () => {
    const file = buildBackup(
      { profile: defaultProfile, goal: defaultGoal(0), reminders: defaultReminders, cups: defaultCups, beverages: defaultBeverages, prefs: defaultPrefs, logs, daySummaries: summaries, progress: defaultProgress(START) },
      new Date(),
      1,
    );
    const [text, exportMs] = time(() => JSON.stringify(file));
    const [r, importMs] = time(() => parseBackup(text, 1));
    expect(r.ok).toBe(true);
    expect(r.ok && r.summary.drinks).toBe(DAYS * 8);
    expect(text.length).toBeLessThan(5_000_000);
    expect(exportMs).toBeLessThan(1000);
    expect(importMs).toBeLessThan(3000);
  });
  it('keeps a month shard small enough to read in one go', () => {
    const biggest = Math.max(...Object.values(logs).map((l) => l.length));
    expect(biggest).toBeLessThanOrEqual(31 * 8);
    expect(JSON.stringify(logs[monthKeyOf(today)] ?? []).length).toBeLessThan(100_000);
    expect(dayKeyFor(new Date(), 420)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
