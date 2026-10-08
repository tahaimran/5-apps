import { addDays, dateKeyFor, dayDiff, dayOfYear, daysInMonth, isDateKey, monthKeyOf, msUntilMidnight, shiftMonth, weekdayOf } from '../dateKey';
import { catchUpDays, completeDaily, dailyPackId, dailyPuzzle, dailyPuzzleId, dailySeed, effectiveStreak, MAX_FREEZES } from '../daily';
import { defaultDaily } from '../defaults';
import { DAILY_ROTATION } from '../packs';
import { verifyPuzzle } from '../verify';
import type { DailyState } from '../types';

describe('date keys (local time)', () => {
  it('formats the local date, not the UTC one', () => {
    expect(dateKeyFor(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dateKeyFor(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });
  it('does day arithmetic by calendar, across months, years and leap days', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(dayDiff('2026-10-08', '2026-10-10')).toBe(2);
    expect(dayDiff('2026-10-10', '2026-10-08')).toBe(-2);
    expect(dayDiff('2026-03-07', '2026-03-09')).toBe(2); // across a US daylight-saving change
    expect(dayDiff('2026-10-31', '2026-11-02')).toBe(2);
  });
  it('knows the day of the year, month lengths and weekdays', () => {
    expect(dayOfYear('2026-01-01')).toBe(1);
    expect(dayOfYear('2026-12-31')).toBe(365);
    expect(dayOfYear('2028-12-31')).toBe(366);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 10)).toBe(31);
    expect(weekdayOf('2026-10-08')).toBe(4); // Thursday
    expect(monthKeyOf('2026-10-08')).toBe('2026-10');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(isDateKey('2026-10-08')).toBe(true);
    expect(isDateKey('2026-1-8')).toBe(false);
    expect(isDateKey(5)).toBe(false);
  });
  it('counts down to local midnight', () => {
    expect(msUntilMidnight(new Date(2026, 9, 8, 23, 59, 0))).toBe(61_000);
    expect(msUntilMidnight(new Date(2026, 9, 8, 0, 0, 0))).toBeGreaterThan(23 * 3_600_000);
  });
});

describe('daily puzzle (plan §8.6)', () => {
  it('is the same for the same date, difficulty and grid size, and differs by day', () => {
    expect(dailyPuzzle('2026-10-08', 'easy', 8)).toEqual(dailyPuzzle('2026-10-08', 'easy', 8));
    expect(dailyPuzzle('2026-10-08', 'easy', 8).grid).not.toEqual(dailyPuzzle('2026-10-09', 'easy', 8).grid);
    expect(dailyPuzzle('2026-10-08', 'easy', 8).id).toBe(dailyPuzzleId('2026-10-08', 'easy'));
  });
  it('is valid for every difficulty on a year of dates, and rotates the theme', () => {
    const packs = new Set<string>();
    for (let i = 0; i < 366; i++) {
      const key = addDays('2026-01-01', i);
      const difficulty = (['easy', 'medium', 'hard'] as const)[i % 3];
      const p = dailyPuzzle(key, difficulty, difficulty === 'easy' ? 8 : difficulty === 'medium' ? 10 : 12);
      expect(verifyPuzzle(p)).toEqual([]);
      packs.add(p.packId);
      expect(p.packId).toBe(DAILY_ROTATION[dayOfYear(key) % DAILY_ROTATION.length]);
    }
    expect(packs.size).toBe(DAILY_ROTATION.length);
  });
  it('seeds from the date as the plan says', () => {
    expect(dailySeed('2026-10-08')).toBe(dailySeed('2026-10-08'));
    expect(dailySeed('2026-10-08')).not.toBe(dailySeed('2026-10-09'));
    expect(dailyPackId('2026-10-08')).toBeTruthy();
  });
});

const done = (state: DailyState, key: string, today = key, stars: 1 | 2 | 3 = 3) => completeDaily(state, key, today, stars, 1000);

describe('streaks (plan §8.7)', () => {
  it('starts at 1, grows on consecutive days and lapses after a gap', () => {
    let s = done(defaultDaily(), '2026-10-01').state;
    expect(s.streak).toBe(1);
    s = done(s, '2026-10-02').state;
    s = done(s, '2026-10-03').state;
    expect(s).toMatchObject({ streak: 3, bestStreak: 3, lastDailyDateKey: '2026-10-03' });
    s = done(s, '2026-10-07').state; // three days missed, no freeze
    expect(s).toMatchObject({ streak: 1, bestStreak: 3 });
  });

  it('counts the same day only once', () => {
    const first = done(defaultDaily(), '2026-10-01');
    const again = done(first.state, '2026-10-01', '2026-10-01', 2);
    expect(again.counted).toBe(false);
    expect(again.state.streak).toBe(1);
    expect(again.state.completed['2026-10-01'].stars).toBe(3); // the best stars are kept
  });

  it('earns a freeze at 7 days (max 2) and spends one on a single missed day', () => {
    let s = defaultDaily();
    let earned = 0;
    for (let i = 0; i < 7; i++) {
      const r = done(s, addDays('2026-10-01', i));
      s = r.state;
      if (r.freezeEarned) earned++;
    }
    expect(s).toMatchObject({ streak: 7, freezes: 1 });
    expect(earned).toBe(1);
    const missed = done(s, '2026-10-09'); // 2026-10-07 was the last day, 10-08 missed
    expect(missed).toMatchObject({ counted: true, freezeUsed: true });
    expect(missed.state).toMatchObject({ streak: 8, freezes: 0 });
    const twoMissed = done(missed.state, '2026-10-12'); // 10-10 and 10-11 missed
    expect(twoMissed.state.streak).toBe(1);
  });

  it('never holds more than two freezes', () => {
    let s: DailyState = { ...defaultDaily(), streak: 13, bestStreak: 13, lastDailyDateKey: '2026-10-01', freezes: MAX_FREEZES };
    const r = done(s, '2026-10-02');
    expect(r.state.streak).toBe(14);
    expect(r.state.freezes).toBe(MAX_FREEZES);
    expect(r.freezeEarned).toBe(false);
    s = r.state;
  });

  it('does not let catch-up days or a clock set back touch the streak', () => {
    let s = done(defaultDaily(), '2026-10-05').state;
    s = done(s, '2026-10-06').state;
    const catchUp = done(s, '2026-10-01', '2026-10-06');
    expect(catchUp.counted).toBe(false);
    expect(catchUp.state.streak).toBe(2);
    expect(catchUp.state.completed['2026-10-01']).toBeDefined();
    const backwards = done(s, '2026-10-04', '2026-10-04'); // the clock was set back; this date is before the last counted one
    expect(backwards.counted).toBe(false);
    expect(backwards.state.streak).toBe(2);
    expect(backwards.state.lastDailyDateKey).toBe('2026-10-06');
  });

  it('shows the streak as lapsed after a missed day unless a freeze covers it', () => {
    const s: DailyState = { ...defaultDaily(), streak: 5, bestStreak: 5, lastDailyDateKey: '2026-10-06', freezes: 0 };
    expect(effectiveStreak(s, '2026-10-06')).toBe(5);
    expect(effectiveStreak(s, '2026-10-07')).toBe(5);
    expect(effectiveStreak(s, '2026-10-08')).toBe(0);
    expect(effectiveStreak({ ...s, freezes: 1 }, '2026-10-08')).toBe(5);
    expect(effectiveStreak({ ...s, freezes: 1 }, '2026-10-09')).toBe(0);
    expect(effectiveStreak(defaultDaily(), '2026-10-08')).toBe(0);
  });

  it('lists the missed days to catch up on, newest first', () => {
    const s: DailyState = { ...defaultDaily(), completed: { '2026-10-07': { stars: 3, at: 1 }, '2026-10-05': { stars: 2, at: 1 } } };
    expect(catchUpDays(s, '2026-10-08', 4)).toEqual(['2026-10-06', '2026-10-04']);
    expect(catchUpDays(defaultDaily(), '2026-10-08')).toHaveLength(7);
  });
});
