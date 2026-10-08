import { addDays, dayKeyFor, daysBetween, formatDayKey, parseDayKey, startOfWeek, weekdayOf, weekDays } from '../dayKey';
import { d } from '../testHelpers';

describe('dayKeyFor', () => {
  it('uses the local date', () => {
    expect(dayKeyFor(new Date(2026, 9, 8, 14, 0))).toBe('2026-10-08');
  });
  it('counts a 01:30 check-in for the previous day when the day ends at 03:00', () => {
    expect(dayKeyFor(new Date(2026, 9, 8, 1, 30), 3)).toBe('2026-10-07');
  });
  it('rolls over to the next day after the cutoff', () => {
    expect(dayKeyFor(new Date(2026, 9, 8, 3, 0), 3)).toBe('2026-10-08');
  });
  it('crosses month and year boundaries', () => {
    expect(dayKeyFor(new Date(2027, 0, 1, 0, 30), 1)).toBe('2026-12-31');
  });
});

describe('day arithmetic', () => {
  it('round-trips parse/format', () => {
    expect(formatDayKey(parseDayKey(d('2026-02-28')))).toBe('2026-02-28');
  });
  it('adds days across month ends and leap days', () => {
    expect(addDays(d('2026-10-31'), 1)).toBe('2026-11-01');
    expect(addDays(d('2028-02-28'), 1)).toBe('2028-02-29');
    expect(addDays(d('2026-01-01'), -1)).toBe('2025-12-31');
  });
  it('knows weekdays (2026-10-08 is a Thursday)', () => {
    expect(weekdayOf(d('2026-10-08'))).toBe(4);
    expect(weekdayOf(d('2026-10-11'))).toBe(0);
  });
  it('finds the week start for Monday and Sunday weeks', () => {
    expect(startOfWeek(d('2026-10-08'), 1)).toBe('2026-10-05');
    expect(startOfWeek(d('2026-10-11'), 1)).toBe('2026-10-05');
    expect(startOfWeek(d('2026-10-11'), 0)).toBe('2026-10-11');
    expect(startOfWeek(d('2026-10-05'), 1)).toBe('2026-10-05');
  });
  it('lists the 7 days of a week', () => {
    const days = weekDays(d('2026-10-08'), 1);
    expect(days[0]).toBe('2026-10-05');
    expect(days[6]).toBe('2026-10-11');
  });
  it('counts days between, including across DST changes', () => {
    expect(daysBetween(d('2026-10-01'), d('2026-10-08'))).toBe(7);
    expect(daysBetween(d('2026-10-08'), d('2026-10-01'))).toBe(-7);
    expect(daysBetween(d('2026-03-01'), d('2026-04-01'))).toBe(31);
  });
});
