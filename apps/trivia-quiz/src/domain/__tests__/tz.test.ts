/** Run by `npm run test:tz` under several TZ values: local day keys, midnight roll-over, daily seed. */
import { fixtureBank } from '@/testing/fixtureBank';
import { dailySet } from '../daily';
import { addDays, dateKeyFor, dayDiff, msUntilMidnight } from '../dateKey';
import { defaultStreak } from '../defaults';
import { completeDailyStreak } from '../streak';

describe('local dates in any time zone', () => {
  it('formats the local day key', () => {
    expect(dateKeyFor(new Date(2026, 9, 8, 23, 59, 59))).toBe('2026-10-08');
    expect(dateKeyFor(new Date(2026, 9, 9, 0, 0, 1))).toBe('2026-10-09');
  });
  it('counts calendar days across any daylight-saving change', () => {
    expect(dayDiff('2026-03-07', '2026-03-09')).toBe(2);
    expect(dayDiff('2026-10-30', '2026-11-02')).toBe(3);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
  it('is at most one day (plus a second) to the next midnight, even on a 23 or 25 hour day', () => {
    for (const day of [new Date(2026, 2, 8, 12), new Date(2026, 10, 1, 12), new Date(2026, 3, 5, 12), new Date(2026, 9, 4, 12)]) {
      const ms = msUntilMidnight(day);
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(25 * 3_600_000 + 1000);
    }
  });
  it('gives every time zone the same Daily for the same local date', () => {
    const bank = fixtureBank(100);
    const key = dateKeyFor(new Date(2026, 9, 8, 12));
    expect(key).toBe('2026-10-08');
    expect(dailySet(bank, key).questions.map((q) => q.id)).toMatchSnapshot();
  });
  it('counts one streak day per local date over a daylight-saving change', () => {
    let s = defaultStreak();
    for (let n = 0; n < 5; n++) {
      const date = new Date(2026, 2, 6 + n, 20, 0);
      s = completeDailyStreak(s, dateKeyFor(date), date.getTime(), date.getTimezoneOffset()).state;
    }
    expect(s.current).toBe(5);
  });
});
