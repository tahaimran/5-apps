import '@/testing/mocks';
import '@/bootstrap';
import { clockTime, compact, dayMonth, fullDate, longDate, mmss, shortDate, spoken } from '../format';

describe('mmss', () => {
  it.each([
    [0, '0:00'],
    [999, '0:00'],
    [42_000, '0:42'],
    [3 * 60_000 + 12_000, '3:12'],
    [60 * 60_000 + 5_000, '1:00:05'],
    [-5000, '0:00'],
  ])('%d ms is %s', (ms, text) => expect(mmss(ms)).toBe(text));
});

describe('compact', () => {
  it.each([
    [58_000, '58s'],
    [60_000, '1m'],
    [290_000, '4m 50s'],
    [300_000, '5m'],
    [62_400, '1m 2s'],
    [3_900_000, '1h 05m'],
    [0, '0s'],
  ])('%d ms is %s', (ms, text) => expect(compact(ms)).toBe(text));
});

describe('spoken', () => {
  it.each([
    [0, '0 seconds'],
    [1000, '1 second'],
    [42_000, '42 seconds'],
    [60_000, '1 minute'],
    [72_000, '1 minute 12 seconds'],
    [180_000, '3 minutes'],
    [3_723_000, '1 hour 2 minutes 3 seconds'],
  ])('%d ms is "%s"', (ms, text) => expect(spoken(ms)).toBe(text));
});

describe('local time and dates', () => {
  const at = new Date(2026, 10, 4, 14, 5).getTime(); // Wed 4 Nov 2026, 14:05 local
  it('formats the clock both ways', () => {
    expect(clockTime(at, true)).toBe('14:05');
    expect(clockTime(at, false)).toBe('2:05 PM');
    expect(clockTime(new Date(2026, 10, 4, 0, 7).getTime(), false)).toBe('12:07 AM');
    expect(clockTime(new Date(2026, 10, 4, 12, 0).getTime(), false)).toBe('12:00 PM');
  });
  it('writes dates in English month and weekday names', () => {
    expect(shortDate(at)).toBe('Wed 4 Nov');
    expect(longDate(at)).toBe('Wed 4 Nov 2026');
    expect(dayMonth('2026-11-12')).toBe('12 November');
    expect(fullDate('2026-11-12')).toBe('12 November 2026');
  });
});
