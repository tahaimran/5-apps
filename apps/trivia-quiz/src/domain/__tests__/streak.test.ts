import { addDays } from '../dateKey';
import { defaultStreak } from '../defaults';
import { canRestoreStreak, completeDailyStreak, effectiveStreak, restoreStreak, streakAtRisk } from '../streak';
import type { StreakState } from '../types';

const H = 3_600_000;
const day = (n: number) => addDays('2026-10-01', n);
const play = (s: StreakState, n: number, at = n * 24 * H, offset = 0) => completeDailyStreak(s, day(n), at, offset);

describe('streak', () => {
  it('starts at 1 and counts consecutive days', () => {
    let s = defaultStreak();
    for (let n = 0; n < 4; n++) s = play(s, n).state;
    expect(s).toMatchObject({ current: 4, best: 4, lastDate: day(3) });
  });
  it('does not count the same day twice or an earlier date (clock set back)', () => {
    const s = play(defaultStreak(), 5).state;
    expect(play(s, 5).counted).toBe(false);
    expect(play(s, 3).counted).toBe(false);
    expect(play(s, 3).state).toBe(s);
  });
  it('restarts at 1 after a gap of two or more days without a freeze', () => {
    const s = play(play(defaultStreak(), 0).state, 1).state;
    const r = play(s, 4);
    expect(r.state.current).toBe(1);
    expect(r.state.best).toBe(2);
  });
  it('earns a freeze every 7 days, holds at most 2, and spends one to bridge exactly one missed day', () => {
    let s = defaultStreak();
    for (let n = 0; n < 7; n++) s = play(s, n).state;
    expect(s.freezes).toBe(1);
    const bridged = play(s, 8);
    expect(bridged).toMatchObject({ counted: true, freezeUsed: true });
    expect(bridged.state).toMatchObject({ current: 8, freezes: 0 });
    let long = defaultStreak();
    for (let n = 0; n < 14; n++) long = play(long, n).state;
    expect(long.freezes).toBe(2);
    for (let n = 14; n < 21; n++) long = play(long, n).state;
    expect(long.freezes).toBe(2); // never more than 2 held
  });
  it('a freeze does not cover two missed days', () => {
    let s = defaultStreak();
    for (let n = 0; n < 7; n++) s = play(s, n).state;
    expect(play(s, 9).state.current).toBe(1);
  });
  it('shows the lapsed streak as 0 unless a freeze would cover it', () => {
    let s = defaultStreak();
    for (let n = 0; n < 3; n++) s = play(s, n).state; // last day 2
    expect(effectiveStreak(s, day(3))).toBe(3);
    expect(effectiveStreak(s, day(4))).toBe(0);
    expect(effectiveStreak({ ...s, freezes: 1 }, day(4))).toBe(3);
    expect(effectiveStreak(defaultStreak(), day(0))).toBe(0);
  });
  it('blocks a second increment within 20 h only when the time zone changed', () => {
    const s = play(defaultStreak(), 0, 0, 0).state;
    // day changes after a flight west->east: 3 h later, offset +180 min
    const flown = completeDailyStreak(s, day(1), 3 * H, 180);
    expect(flown).toMatchObject({ counted: false, blockedByTimeZone: true });
    // a late-night game then an early one, same zone: both count
    expect(completeDailyStreak(s, day(1), 3 * H, 0).counted).toBe(true);
    // the zone changed but it is 21 h later: counts
    expect(completeDailyStreak(s, day(1), 21 * H, 180).counted).toBe(true);
  });
  it('offers a restore once, for a lost streak of 3 or more after exactly one missed day', () => {
    let s = defaultStreak();
    for (let n = 0; n < 4; n++) s = play(s, n).state; // last day 3, streak 4
    expect(canRestoreStreak(s, day(4))).toBe(false); // nothing missed
    expect(canRestoreStreak(s, day(5))).toBe(true);
    expect(canRestoreStreak(s, day(6))).toBe(false); // two days missed
    expect(canRestoreStreak({ ...s, current: 2 }, day(5))).toBe(false);
    expect(canRestoreStreak({ ...s, freezes: 1 }, day(5))).toBe(false);
    const restored = restoreStreak(s, day(5));
    expect(effectiveStreak(restored, day(5))).toBe(4);
    expect(canRestoreStreak(restored, day(5))).toBe(false);
    expect(play(restored, 5).state.current).toBe(5);
  });
  it('flags a streak at risk from 18:00 when the Daily is not played', () => {
    const s = play(defaultStreak(), 0).state;
    expect(streakAtRisk(s, day(1), 17, false)).toBe(false);
    expect(streakAtRisk(s, day(1), 18, false)).toBe(true);
    expect(streakAtRisk(s, day(1), 20, true)).toBe(false);
    expect(streakAtRisk(defaultStreak(), day(1), 20, false)).toBe(false);
  });
});
