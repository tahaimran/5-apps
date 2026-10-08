/**
 * Run under several time zones by `npm run test:tz` (TZ=... jest). The day logic must give the
 * same calendar answers wherever the phone is, including across daylight-saving changes.
 */
import { addDays, dateKeyFor, dayDiff, msUntilMidnight } from '../dateKey';
import { completeDaily } from '../daily';
import { defaultDaily } from '../defaults';

const DAY = 86_400_000;

describe(`day logic in ${process.env.TZ ?? 'the default'} time zone`, () => {
  it('walks every day of 2026 and 2028 without skipping or repeating a date', () => {
    for (const year of [2026, 2028]) {
      let key = `${year}-01-01`;
      for (let i = 0; i < (year === 2028 ? 366 : 365); i++) {
        const [y, m, d] = key.split('-').map(Number);
        // noon is never inside a daylight-saving gap, so the local date of noon is the date
        expect(dateKeyFor(new Date(y, m - 1, d, 12))).toBe(key);
        const next = addDays(key, 1);
        expect(dayDiff(key, next)).toBe(1);
        key = next;
      }
      expect(key).toBe(`${year + 1}-01-01`);
    }
  });

  it('turns over at local midnight, whatever the length of the day', () => {
    for (const base of [new Date(2026, 2, 8, 12), new Date(2026, 2, 29, 12), new Date(2026, 9, 25, 12), new Date(2026, 10, 1, 12), new Date(2026, 3, 5, 12), new Date(2026, 9, 4, 12)]) {
      const ms = msUntilMidnight(base);
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(13 * 3_600_000 + 1000 + 3_600_000); // from noon, at most 12 h (+1 h for a long day, +1 s)
      const after = new Date(base.getTime() + ms);
      expect(dateKeyFor(after)).toBe(addDays(dateKeyFor(base), 1));
      expect(after.getHours() * 60 + after.getMinutes()).toBeLessThanOrEqual(61); // just past midnight (a 30-minute shift can push it to 00:30)
    }
    expect(msUntilMidnight(new Date(2026, 9, 8, 23, 59, 59, 500))).toBeLessThan(3000);
    expect(DAY).toBe(86_400_000);
  });

  it('keeps a daily streak going through a daylight-saving weekend', () => {
    let s = defaultDaily();
    let key = '2026-03-05';
    for (let i = 0; i < 10; i++) {
      s = completeDaily(s, key, key, 3, i).state;
      key = addDays(key, 1);
    }
    expect(s.streak).toBe(10);
    let fall = defaultDaily();
    key = '2026-10-28';
    for (let i = 0; i < 8; i++) {
      fall = completeDaily(fall, key, key, 3, i).state;
      key = addDays(key, 1);
    }
    expect(fall.streak).toBe(8);
  });
});
