/**
 * Checklist §18 "Streaks correct across ... DST change, timezone change, dayEndsAt 0-4,
 * editing past days".
 *
 * Jest cannot change the process time zone mid-run, so the zone comes from the TZ environment
 * variable and `npm run test:tz` runs this file once per zone (spring-forward, fall-back,
 * half-hour offsets, southern hemisphere). A plain `npm test` runs it in the machine's zone.
 */
import { addDays, dayKeyFor, daysBetween, startOfWeek, weekDays } from '../dayKey';
import { computeStreaks } from '../streaks';
import { habitCompletion } from '../percent';
import { buildHeatmap } from '../heatmap';
import { d, done, habit } from '../testHelpers';

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Day keys from `from` to `to` inclusive. */
function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let day = d(from); day <= d(to); day = addDays(day, 1)) out.push(day);
  return out;
}

describe(`in ${zone}`, () => {
  it('runs in the zone it was asked to', () => {
    if (process.env.TZ) expect(zone).toBe(process.env.TZ === 'UTC' ? 'UTC' : process.env.TZ);
  });

  it.each([
    ['spring forward 2026', '2026-03-05', '2026-03-12'],
    ['fall back 2026', '2026-10-28', '2026-11-05'],
    ['southern hemisphere spring', '2026-09-30', '2026-10-08'],
    ['southern hemisphere autumn', '2026-04-01', '2026-04-10'],
    ['year end', '2026-12-28', '2027-01-04'],
  ])('a daily streak is unbroken across %s', (_name, from, to) => {
    const h = habit({ createdAt: d(from) });
    const days = range(from, to);
    const entries = done(...days);
    expect(computeStreaks(h, entries, d(to), 1).current).toBe(days.length);
    expect(computeStreaks(h, entries, d(to), 1).best).toBe(days.length);
  });

  it('adds days without skipping or repeating one across every transition in 2026', () => {
    let day = d('2026-01-01');
    for (let i = 0; i < 365; i++) {
      const next = addDays(day, 1);
      expect(daysBetween(day, next)).toBe(1);
      day = next;
    }
    expect(day).toBe('2027-01-01');
  });

  it('keeps week boundaries stable through a DST change', () => {
    for (const anchor of ['2026-03-08', '2026-03-29', '2026-10-25', '2026-11-01', '2026-04-05', '2026-10-04']) {
      const week = weekDays(d(anchor), 1);
      expect(week).toHaveLength(7);
      expect(new Set(week).size).toBe(7);
      expect(startOfWeek(d(anchor), 1)).toBe(week[0]);
      expect(week.includes(d(anchor))).toBe(true);
    }
  });

  it('a per-week streak survives the DST week', () => {
    const h = habit({ schedule: { kind: 'perWeek', times: 2 }, createdAt: d('2026-03-01') });
    // Mon 03-02 and Wed 03-04, Mon 03-09 and Thu 03-12 (DST in the US starts Sun 03-08)
    const entries = done('2026-03-02', '2026-03-04', '2026-03-09', '2026-03-12', '2026-03-16', '2026-03-18');
    expect(computeStreaks(h, entries, d('2026-03-18'), 1)).toMatchObject({ current: 3, unit: 'weeks' });
  });

  it('completion percentages count the right number of days over a DST change', () => {
    const h = habit({ createdAt: d('2026-03-01') });
    const entries = done(...range('2026-03-01', '2026-03-14'));
    expect(habitCompletion(h, entries, d('2026-03-14'), 14)).toBe(1);
    // window 03-07..03-20: 03-07..03-14 done, the rest not
    expect(habitCompletion(h, entries, d('2026-03-20'), 14)).toBeCloseTo(8 / 14);
  });

  it('the heatmap has the same cells on either side of a DST change', () => {
    const h = habit({ createdAt: d('2026-01-05') });
    const grid = buildHeatmap(h, {}, d('2026-11-03'), 1);
    const flat = grid.flat().map((c) => c.day);
    expect(new Set(flat).size).toBe(flat.length);
    for (let i = 1; i < flat.length; i++) expect(daysBetween(flat[i - 1], flat[i])).toBe(1);
  });
});

describe('dayEndsAt 0-4', () => {
  it.each([0, 1, 2, 3, 4])('with %i, a check-in just before the cutoff counts for the day before, at the cutoff for today', (hour) => {
    const justBefore = new Date(2026, 9, 8, hour, 0, 0, 0);
    justBefore.setMilliseconds(justBefore.getMilliseconds() - 1);
    expect(dayKeyFor(justBefore, hour)).toBe('2026-10-07');
    expect(dayKeyFor(new Date(2026, 9, 8, hour, 0, 0, 0), hour)).toBe('2026-10-08');
    expect(dayKeyFor(new Date(2026, 9, 8, 23, 59, 59), hour)).toBe('2026-10-08');
  });

  it.each([0, 1, 2, 3, 4])('with %i, the day key only ever moves forward one day at a time over a full year of hours', (hour) => {
    let previous = dayKeyFor(new Date(2026, 0, 1, 0), hour);
    for (let h = 1; h < 365 * 24; h++) {
      const key = dayKeyFor(new Date(2026, 0, 1, h), hour);
      if (key !== previous) expect(daysBetween(previous, key)).toBe(1);
      previous = key;
    }
  });

  it('a night-owl check-in at 01:30 with dayEndsAt 3 extends the previous day streak', () => {
    const h = habit({ createdAt: d('2026-10-01') });
    const checkIn = dayKeyFor(new Date(2026, 9, 8, 1, 30), 3);
    expect(checkIn).toBe('2026-10-07');
    const entries = done('2026-10-05', '2026-10-06', checkIn);
    expect(computeStreaks(h, entries, dayKeyFor(new Date(2026, 9, 8, 2, 0), 3), 1).current).toBe(3);
  });
});

describe('timezone change', () => {
  // A phone in another zone just shows a different wall clock, so these use the wall clock the
  // phone would show. Stored day keys are strings and never depend on the zone.
  const h = habit({ createdAt: d('2026-10-01') });
  const entries = done('2026-10-05', '2026-10-06', '2026-10-07');

  it('stored days do not move when the phone changes zone; only "today" does', () => {
    const home = dayKeyFor(new Date(2026, 9, 7, 18, 0), 0); // evening of the 7th
    const away = dayKeyFor(new Date(2026, 9, 8, 10, 0), 0); // same instant in Tokyo: morning of the 8th
    expect([home, away]).toEqual(['2026-10-07', '2026-10-08']);
    expect(computeStreaks(h, entries, home, 1).current).toBe(3);
    expect(computeStreaks(h, entries, away, 1).current).toBe(3); // the 8th is not done yet: not a break
    expect(entries['2026-10-07' as never]).toBeDefined();
  });

  it('flying west repeats a day without losing the streak', () => {
    const east = dayKeyFor(new Date(2026, 9, 9, 5, 0), 0); // 05:00 on the 9th
    const west = dayKeyFor(new Date(2026, 9, 8, 13, 0), 0); // the same instant, 13:00 on the 8th
    expect([east, west]).toEqual(['2026-10-09', '2026-10-08']);
    const checked = done('2026-10-06', '2026-10-07', '2026-10-08');
    expect(computeStreaks(h, checked, east, 1).current).toBe(3);
    expect(computeStreaks(h, checked, west, 1).current).toBe(3);
  });

  it('a long trip that skips a day ends the streak only when a whole day is missed', () => {
    const checked = done('2026-10-06', '2026-10-07');
    expect(computeStreaks(h, checked, d('2026-10-08'), 1).current).toBe(2);
    expect(computeStreaks(h, checked, d('2026-10-09'), 1).current).toBe(0);
  });
});

describe('editing past days', () => {
  const h = habit({ createdAt: d('2026-10-01') });
  const today = d('2026-10-08');

  it('filling a gap joins two runs into one streak and updates the best', () => {
    const gap = done('2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07');
    expect(computeStreaks(h, gap, today, 1)).toMatchObject({ current: 3, best: 3 });
    const filled = { ...gap, ...done('2026-10-04') };
    expect(computeStreaks(h, filled, today, 1)).toMatchObject({ current: 6, best: 6 });
  });

  it('removing a past check-in splits the run', () => {
    const full = done('2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07');
    const { ['2026-10-04' as never]: _removed, ...cut } = full;
    expect(computeStreaks(h, cut, today, 1)).toMatchObject({ current: 3, best: 3 });
  });

  it('editing before the start date changes nothing', () => {
    const entries = done('2026-09-20', '2026-10-07');
    expect(computeStreaks(h, entries, today, 1).current).toBe(1);
  });
});
