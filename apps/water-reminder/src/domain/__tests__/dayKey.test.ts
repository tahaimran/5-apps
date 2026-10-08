import { addDays, atMinute, dayKeyFor, daysBetween, dayRange, formatClock, localDateKey, minuteOfDay, monthKeyOf, parseDayKey, weekdayOf } from '../dayKey';

const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi);

describe('day keys', () => {
  it('formats and parses local dates', () => {
    expect(localDateKey(at(2026, 10, 8, 23, 59))).toBe('2026-10-08');
    expect(parseDayKey('2026-10-08').getDate()).toBe(8);
    expect(monthKeyOf('2026-10-08')).toBe('2026-10');
    expect(weekdayOf('2026-10-08')).toBe(4); // Thursday
  });
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('counts days between keys and builds ranges', () => {
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7);
    expect(daysBetween('2026-10-08', '2026-10-01')).toBe(-7);
    expect(dayRange('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(dayRange('2026-10-08', '2026-10-07')).toEqual([]);
  });
  it('formats clock times, wrapping past midnight', () => {
    expect(formatClock(450)).toBe('07:30');
    expect(formatClock(1500)).toBe('01:00');
    expect(formatClock(-30)).toBe('23:30');
  });
  it('places a minute offset on a day, running into the next day past 1440', () => {
    expect(minuteOfDay(atMinute('2026-10-08', 450))).toBe(450);
    expect(localDateKey(atMinute('2026-10-08', 1500))).toBe('2026-10-09');
    expect(minuteOfDay(atMinute('2026-10-08', 1500))).toBe(60);
  });
});

describe('logical day (plan §8.5)', () => {
  const wake = 7 * 60;
  it('starts two hours before wake-up', () => {
    expect(dayKeyFor(at(2026, 10, 8, 4, 59), wake)).toBe('2026-10-07');
    expect(dayKeyFor(at(2026, 10, 8, 5, 0), wake)).toBe('2026-10-08');
  });
  it('counts a 01:30 drink for yesterday when waking at 07:00', () => {
    expect(dayKeyFor(at(2026, 10, 8, 1, 30), wake)).toBe('2026-10-07');
    expect(dayKeyFor(at(2026, 10, 8, 23, 59), wake)).toBe('2026-10-08');
  });
  it('accepts a timestamp', () => {
    expect(dayKeyFor(at(2026, 10, 8, 12).getTime(), wake)).toBe('2026-10-08');
  });
  it('moves the start of the day to the evening before for an early riser (wake 00:30)', () => {
    expect(dayKeyFor(at(2026, 10, 8, 21, 59), 30)).toBe('2026-10-08');
    expect(dayKeyFor(at(2026, 10, 8, 22, 30), 30)).toBe('2026-10-09');
    expect(dayKeyFor(at(2026, 10, 9, 10, 0), 30)).toBe('2026-10-09');
  });
  it('re-buckets only by the wake time passed in', () => {
    const t = at(2026, 10, 8, 6, 0);
    expect(dayKeyFor(t, 7 * 60)).toBe('2026-10-08');
    expect(dayKeyFor(t, 9 * 60)).toBe('2026-10-07');
  });
});
