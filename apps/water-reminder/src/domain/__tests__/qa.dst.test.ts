/**
 * Day keys and reminder times around daylight-saving changes. `npm run test:tz` runs this file in
 * several time zones (Jest cannot switch zones mid-run); in any single zone it must still hold.
 */
import { addDays, atMinute, dayKeyFor, localDateKey, minuteOfDay } from '../dayKey';
import { defaultReminders } from '../defaults';
import { planReminders } from '../reminderPlan';
import { buildSlots } from '../schedule';

const SPANS: [string, string][] = [
  ['2026-03-01', '2026-04-15'], // US/EU spring forward, AU/NZ fall back
  ['2026-09-20', '2026-11-10'], // AU/NZ spring forward, US/EU fall back
];

const days = ([from, to]: [string, string]) => {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};

describe(`reminders around DST (TZ=${process.env.TZ ?? 'system'})`, () => {
  const slots = buildSlots(defaultReminders, 2300, 250);

  it.each(SPANS)('plans the same 10 daytime slots every day from %s to %s', (...span) => {
    for (const day of days(span)) {
      const now = atMinute(day, 10);
      const plan = planReminders({ now, reminders: defaultReminders, goalMl: 2300, cupMl: 250, logTimes: [], todayReached: false });
      expect(plan).toHaveLength(slots.length * 3);
      const times = plan.map((p) => p.at.getTime());
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(new Set(times).size).toBe(times.length);
      for (const p of plan) {
        expect(minuteOfDay(p.at)).toBeGreaterThanOrEqual(450);
        expect(minuteOfDay(p.at)).toBeLessThanOrEqual(1350);
        expect(p.day).toBe(localDateKey(p.at));
      }
    }
  });

  it.each(SPANS)('never skips or repeats a logical day hour by hour from %s to %s', (...span) => {
    let previous = '';
    const start = atMinute(span[0], 0).getTime();
    const end = atMinute(span[1], 0).getTime();
    for (let t = start; t <= end; t += 3_600_000) {
      const key = dayKeyFor(t, 420);
      if (previous) {
        expect(key >= previous).toBe(true);
        expect(key <= addDays(previous, 1)).toBe(true);
      }
      previous = key;
    }
  });

  it('keeps the logical day boundary at 05:00 local time on the transition days', () => {
    for (const day of ['2026-03-08', '2026-03-29', '2026-10-04', '2026-11-01', '2026-04-05']) {
      expect(dayKeyFor(atMinute(day, 4 * 60 + 59), 420)).toBe(addDays(day, -1));
      expect(dayKeyFor(atMinute(day, 5 * 60), 420)).toBe(day);
    }
  });

  it('plans an overnight schedule without duplicates or misordering over a transition', () => {
    const reminders = { ...defaultReminders, wakeMin: 600, bedMin: 120, frequency: 'interval' as const };
    for (const day of ['2026-03-07', '2026-03-28', '2026-10-03', '2026-10-31', '2026-04-04']) {
      const plan = planReminders({ now: atMinute(day, 5), reminders, goalMl: 2300, cupMl: 250, logTimes: [], todayReached: false });
      const times = plan.map((p) => p.at.getTime());
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(new Set(times).size).toBe(times.length);
      expect(plan.length).toBeGreaterThan(10);
    }
  });
});
