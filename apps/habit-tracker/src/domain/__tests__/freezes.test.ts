import { canEarnFromAd, earnFromAd, earnPerfectWeek, emptyFreezes, isPerfectWeek, MAX_FREEZES, planFreezes } from '../freezes';
import { computeStreaks } from '../streaks';
import type { FreezeState } from '../types';
import { d, done, habit } from '../testHelpers';

const TODAY = d('2026-10-08');
const withCount = (count: number): FreezeState => ({ count, log: [] });

describe('earning freezes', () => {
  it('rewarded ad grants one per day', () => {
    const once = earnFromAd(emptyFreezes, TODAY);
    expect(once.count).toBe(1);
    expect(canEarnFromAd(once, TODAY)).toBe(false);
    expect(earnFromAd(once, TODAY)).toBe(once);
    expect(canEarnFromAd(once, d('2026-10-09'))).toBe(true);
  });
  it('inventory is capped', () => {
    const full = withCount(MAX_FREEZES);
    expect(canEarnFromAd(full, TODAY)).toBe(false);
    expect(earnPerfectWeek(full, d('2026-09-28')).count).toBe(MAX_FREEZES);
  });
  it('perfect week grants one per week', () => {
    const once = earnPerfectWeek(emptyFreezes, d('2026-09-28'));
    expect(once.count).toBe(1);
    expect(earnPerfectWeek(once, d('2026-09-28'))).toBe(once);
    expect(earnPerfectWeek(once, d('2026-10-05')).count).toBe(2);
  });
  it('logs every grant', () => {
    expect(earnFromAd(emptyFreezes, TODAY).log).toEqual([{ day: TODAY, source: 'ad' }]);
  });
});

describe('isPerfectWeek', () => {
  const daily = habit({ id: 'a', createdAt: d('2026-09-01') });
  const week = d('2026-09-28');
  const all = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];

  it('needs every scheduled day done', () => {
    expect(isPerfectWeek([daily], { a: done(...all) }, week, TODAY, 1)).toBe(true);
    expect(isPerfectWeek([daily], { a: done(...all.slice(1)) }, week, TODAY, 1)).toBe(false);
  });
  it('is false while the week is still running', () => {
    expect(isPerfectWeek([daily], { a: done('2026-10-05') }, d('2026-10-05'), TODAY, 1)).toBe(false);
  });
  it('per-week habits need their weekly target', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 2 }, createdAt: d('2026-09-01') });
    expect(isPerfectWeek([p], { p: done('2026-09-29', '2026-10-01') }, week, TODAY, 1)).toBe(true);
    expect(isPerfectWeek([p], { p: done('2026-09-29') }, week, TODAY, 1)).toBe(false);
  });
  it('is false with no habits in play', () => {
    expect(isPerfectWeek([], {}, week, TODAY, 1)).toBe(false);
    expect(isPerfectWeek([habit({ createdAt: d('2026-10-20') })], {}, week, TODAY, 1)).toBe(false);
  });
});

describe('planFreezes', () => {
  const h = habit({ id: 'a', createdAt: d('2026-10-01') });
  // streak 10-01..10-05 (5 days), missed 10-06 (two days ago), today 10-08
  const base = done('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05');

  it('spends a freeze to protect a streak of 2+ missed two days ago', () => {
    const plan = planFreezes({ habits: [h], entries: { a: { ...base, '2026-10-07': done('2026-10-07')['2026-10-07'] } }, freezes: withCount(1), today: TODAY, weekStartsOn: 1 });
    expect(plan.freezes.count).toBe(0);
    expect(plan.writes).toHaveLength(1);
    expect(plan.writes[0]).toMatchObject({ habitId: 'a', day: '2026-10-06' });
    expect(plan.freezes.log).toEqual([{ day: '2026-10-06', source: 'used' }]);
  });
  it('keeps the streak intact after applying the writes', () => {
    const entries = { ...base, '2026-10-07': done('2026-10-07')['2026-10-07'] };
    const plan = planFreezes({ habits: [h], entries: { a: entries }, freezes: withCount(1), today: TODAY, weekStartsOn: 1 });
    const applied = { ...entries, [plan.writes[0].day]: plan.writes[0].entry };
    expect(computeStreaks(h, applied, TODAY).current).toBe(6);
  });
  it('does nothing without freezes', () => {
    const plan = planFreezes({ habits: [h], entries: { a: base }, freezes: withCount(0), today: TODAY, weekStartsOn: 1 });
    expect(plan.writes).toHaveLength(0);
  });
  it('does not save streaks shorter than 2', () => {
    const plan = planFreezes({ habits: [h], entries: { a: done('2026-10-05') }, freezes: withCount(2), today: TODAY, weekStartsOn: 1 });
    expect(plan.writes).toHaveLength(0);
    expect(plan.freezes.count).toBe(2);
  });
  it('never reaches back further than 2 days', () => {
    const old = done('2026-10-01', '2026-10-02', '2026-10-03'); // missed 10-04.. (4 days ago)
    const plan = planFreezes({ habits: [h], entries: { a: old }, freezes: withCount(2), today: TODAY, weekStartsOn: 1 });
    expect(plan.writes).toHaveLength(0);
  });
  it('one freeze protects every habit that day', () => {
    const b = habit({ id: 'b', createdAt: d('2026-10-01') });
    const plan = planFreezes({
      habits: [h, b],
      entries: { a: { ...base, ...done('2026-10-07') }, b: { ...done('2026-10-04', '2026-10-05'), ...done('2026-10-07') } },
      freezes: withCount(2),
      today: TODAY,
      weekStartsOn: 1,
    });
    expect(plan.freezes.count).toBe(1);
    expect(plan.writes.map((w) => w.habitId).sort()).toEqual(['a', 'b']);
  });
  it('can spend two freezes on two consecutive missed days', () => {
    const plan = planFreezes({ habits: [h], entries: { a: base }, freezes: withCount(2), today: d('2026-10-08'), weekStartsOn: 1 });
    expect(plan.freezes.count).toBe(0);
    expect(plan.writes.map((w) => w.day)).toEqual(['2026-10-06', '2026-10-07']);
  });
  it('is idempotent once the freezes are written', () => {
    const entries = { ...base, '2026-10-06': { value: 0, frozen: true, updatedAt: 0 }, ...done('2026-10-07') };
    const plan = planFreezes({ habits: [h], entries: { a: entries }, freezes: withCount(1), today: TODAY, weekStartsOn: 1 });
    expect(plan.writes).toHaveLength(0);
    expect(plan.freezes.count).toBe(1);
  });
  it('ignores non-scheduled days for weekday habits', () => {
    const mwf = habit({ id: 'w', schedule: { kind: 'weekdays', days: [1, 3, 5] }, createdAt: d('2026-09-28') });
    const e = done('2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05'); // Tue 10-06 not scheduled; Wed 10-07 missed (yesterday)
    const plan = planFreezes({ habits: [mwf], entries: { w: e }, freezes: withCount(1), today: TODAY, weekStartsOn: 1 });
    expect(plan.writes.map((w) => w.day)).toEqual(['2026-10-07']);
  });
  it('gives per-week habits a frozen completion unless their week is met', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 3 }, createdAt: d('2026-10-01') });
    const plan = planFreezes({ habits: [h, p], entries: { a: base, p: done('2026-10-05') }, freezes: withCount(1), today: d('2026-10-07'), weekStartsOn: 1 });
    expect(plan.writes.some((w) => w.habitId === 'p')).toBe(true);
    const met = planFreezes({ habits: [h, p], entries: { a: base, p: done('2026-10-05', '2026-10-06', '2026-10-07') }, freezes: withCount(1), today: d('2026-10-07'), weekStartsOn: 1 });
    expect(met.writes.some((w) => w.habitId === 'p')).toBe(false);
  });
  it('skips archived habits', () => {
    const arch = habit({ id: 'z', createdAt: d('2026-10-01'), archivedAt: '2026-10-07' });
    const plan = planFreezes({ habits: [arch], entries: { z: base }, freezes: withCount(1), today: TODAY, weekStartsOn: 1 });
    expect(plan.writes).toHaveLength(0);
  });
});
