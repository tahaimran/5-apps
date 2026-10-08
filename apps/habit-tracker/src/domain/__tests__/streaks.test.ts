import { computeStreaks, streakBefore, weekCount } from '../streaks';
import { d, done, entry, frozen, habit } from '../testHelpers';

const TODAY = d('2026-10-08'); // Thursday

describe('daily streaks', () => {
  const h = habit({ createdAt: d('2026-10-01') });

  it('is zero with no entries', () => {
    expect(computeStreaks(h, {}, TODAY)).toEqual({ current: 0, best: 0, unit: 'days' });
  });
  it('counts consecutive days ending today', () => {
    const e = done('2026-10-06', '2026-10-07', '2026-10-08');
    expect(computeStreaks(h, e, TODAY).current).toBe(3);
  });
  it('an incomplete today does not break the streak', () => {
    const e = done('2026-10-05', '2026-10-06', '2026-10-07');
    expect(computeStreaks(h, e, TODAY).current).toBe(3);
  });
  it('a missed past day breaks it', () => {
    const e = done('2026-10-05', '2026-10-07', '2026-10-08');
    expect(computeStreaks(h, e, TODAY).current).toBe(2);
  });
  it('a streak that ended before yesterday is zero', () => {
    const e = done('2026-10-03', '2026-10-04', '2026-10-05');
    expect(computeStreaks(h, e, TODAY).current).toBe(0);
  });
  it('tracks the best run over history', () => {
    const e = done('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-06', '2026-10-07');
    expect(computeStreaks(h, e, TODAY)).toMatchObject({ current: 2, best: 4 });
  });
  it('ignores days before the start date', () => {
    const young = habit({ createdAt: d('2026-10-07') });
    const e = done('2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08');
    expect(computeStreaks(young, e, TODAY)).toMatchObject({ current: 2, best: 2 });
  });
  it('a habit created today starts at zero until checked', () => {
    const fresh = habit({ createdAt: TODAY });
    expect(computeStreaks(fresh, {}, TODAY).current).toBe(0);
    expect(computeStreaks(fresh, done('2026-10-08'), TODAY).current).toBe(1);
  });
  it('a habit starting in the future has no streak', () => {
    expect(computeStreaks(habit({ createdAt: d('2026-10-20') }), {}, TODAY).current).toBe(0);
  });
  it('partial count values do not count', () => {
    const water = habit({ type: 'count', target: 8 });
    const e = { '2026-10-07': entry(8), '2026-10-08': entry(3) } as never;
    expect(computeStreaks(water, e, TODAY).current).toBe(1);
  });
  it('frozen days keep the streak alive without adding to it', () => {
    const e = { ...done('2026-10-05', '2026-10-07', '2026-10-08'), '2026-10-06': frozen() };
    expect(computeStreaks(h, e, TODAY).current).toBe(3);
  });
  it('a frozen day alone does not start a streak', () => {
    expect(computeStreaks(h, { '2026-10-07': frozen() }, TODAY).current).toBe(0);
  });
});

describe('weekday streaks', () => {
  const mwf = habit({ schedule: { kind: 'weekdays', days: [1, 3, 5] }, createdAt: d('2026-09-28') });

  it('non-scheduled days are transparent', () => {
    // Mon 10-05, Wed 10-07 done; Tue/Thu not scheduled
    const e = done('2026-10-05', '2026-10-07');
    expect(computeStreaks(mwf, e, TODAY).current).toBe(2);
  });
  it('a missed scheduled day breaks the streak', () => {
    const e = done('2026-09-28', '2026-10-05'); // missed Wed 09-30 and Fri 10-02 and Wed 10-07
    expect(computeStreaks(mwf, e, TODAY).current).toBe(0);
  });
  it('bonus completion on a non-scheduled day does not extend the streak', () => {
    const e = done('2026-10-05', '2026-10-06', '2026-10-07'); // Tue is a bonus
    expect(computeStreaks(mwf, e, TODAY).current).toBe(2);
  });
  it('spans weeks through weekends', () => {
    const e = done('2026-10-02', '2026-10-05', '2026-10-07');
    expect(computeStreaks(mwf, e, TODAY).current).toBe(3);
  });
  it('an unscheduled today leaves the streak as is', () => {
    const e = done('2026-10-05', '2026-10-07');
    expect(computeStreaks(mwf, e, d('2026-10-09')).current).toBe(2); // Fri not done yet, in progress
    expect(computeStreaks(mwf, e, d('2026-10-08')).current).toBe(2); // Thu not scheduled
  });
});

describe('per-week streaks', () => {
  const three = habit({ schedule: { kind: 'perWeek', times: 3 }, createdAt: d('2026-09-14') });

  it('counts weeks that met the target', () => {
    const e = done(
      '2026-09-14', '2026-09-16', '2026-09-18', // week of 09-14
      '2026-09-21', '2026-09-23', '2026-09-25', // week of 09-21
      '2026-09-28', '2026-09-30', '2026-10-02', // week of 09-28
    );
    expect(computeStreaks(three, e, TODAY)).toEqual({ current: 3, best: 3, unit: 'weeks' });
  });
  it('the current week in progress never breaks the streak', () => {
    const e = done('2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05');
    expect(computeStreaks(three, e, TODAY).current).toBe(1);
  });
  it('the current week counts once its target is met', () => {
    const e = done('2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07');
    expect(computeStreaks(three, e, TODAY).current).toBe(2);
  });
  it('an unmet past week breaks it', () => {
    const e = done('2026-09-21', '2026-09-23', '2026-09-25', '2026-09-28', '2026-09-30'); // week 09-28 has 2
    expect(computeStreaks(three, e, TODAY).current).toBe(0);
  });
  it('a freeze counts as one completion toward its week', () => {
    const e = { ...done('2026-09-28', '2026-09-30'), '2026-10-01': frozen() };
    expect(computeStreaks(three, e, TODAY).current).toBe(1);
  });
  it('respects a Sunday week start', () => {
    expect(weekCount(three, done('2026-10-04', '2026-10-05'), TODAY, 0)).toBe(2);
    expect(weekCount(three, done('2026-10-04', '2026-10-05'), TODAY, 1)).toBe(1);
  });
  it('the week of the start date is judged on its own days', () => {
    const late = habit({ schedule: { kind: 'perWeek', times: 1 }, createdAt: d('2026-10-07') });
    expect(computeStreaks(late, done('2026-10-07'), TODAY).current).toBe(1);
  });
});

describe('streakBefore', () => {
  const h = habit({ createdAt: d('2026-10-01') });
  it('counts the run immediately before a day, with no grace for gaps', () => {
    expect(streakBefore(h, done('2026-10-05', '2026-10-06'), d('2026-10-07'))).toBe(2);
    expect(streakBefore(h, done('2026-10-05'), d('2026-10-07'))).toBe(0); // 10-06 was missed
  });
  it('is zero for per-week habits', () => {
    expect(streakBefore(habit({ schedule: { kind: 'perWeek', times: 2 } }), {}, d('2026-10-07'))).toBe(0);
  });
});
