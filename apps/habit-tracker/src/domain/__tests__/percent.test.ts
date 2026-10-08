import { dayProgress, habitCompletion } from '../percent';
import { d, done, frozen, habit } from '../testHelpers';

const TODAY = d('2026-10-08');

describe('habitCompletion', () => {
  const h = habit({ createdAt: d('2026-09-01') });

  it('is done days over scheduled days in the window', () => {
    const e = done('2026-10-02', '2026-10-04', '2026-10-06', '2026-10-08');
    expect(habitCompletion(h, e, TODAY, 7)).toBeCloseTo(4 / 7);
  });
  it('only counts days since the start date', () => {
    const young = habit({ createdAt: d('2026-10-06') });
    expect(habitCompletion(young, done('2026-10-06'), TODAY, 30)).toBeCloseTo(1 / 3);
  });
  it('frozen days count neither way', () => {
    const e = { ...done('2026-10-07', '2026-10-08'), '2026-10-06': frozen() };
    expect(habitCompletion(habit({ createdAt: d('2026-10-06') }), e, TODAY, 7)).toBe(1);
  });
  it('only counts scheduled weekdays', () => {
    const mwf = habit({ schedule: { kind: 'weekdays', days: [1, 3, 5] }, createdAt: d('2026-10-05') });
    expect(habitCompletion(mwf, done('2026-10-05'), TODAY, 'all')).toBe(0.5); // Mon done, Wed missed
  });
  it('supports the all-time window', () => {
    expect(habitCompletion(h, done('2026-09-01'), TODAY, 'all')).toBeCloseTo(1 / 38);
  });
  it('is null when nothing was scheduled', () => {
    const none = habit({ schedule: { kind: 'weekdays', days: [0] }, createdAt: d('2026-10-05') });
    expect(habitCompletion(none, {}, TODAY, 'all')).toBeNull();
    expect(habitCompletion(habit({ createdAt: d('2026-10-20') }), {}, TODAY, 7)).toBeNull();
  });
  it('per-week habits sum min(done, X) over the weeks', () => {
    const p = habit({ schedule: { kind: 'perWeek', times: 3 }, createdAt: d('2026-09-28') });
    const e = done('2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-05'); // 4 -> capped 3, then 1
    expect(habitCompletion(p, e, TODAY, 'all')).toBeCloseTo(4 / 6);
  });
});

describe('dayProgress', () => {
  it('counts habits scheduled today', () => {
    const a = habit({ id: 'a' });
    const b = habit({ id: 'b' });
    const c = habit({ id: 'c', schedule: { kind: 'weekdays', days: [0] } }); // Sunday only
    expect(dayProgress([a, b, c], { a: done('2026-10-08') }, TODAY)).toEqual({ done: 1, total: 2 });
  });
  it('per-week habits stop counting once the weekly target is met', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 2 } });
    const e = { p: done('2026-10-05', '2026-10-06') };
    expect(dayProgress([p], e, TODAY)).toEqual({ done: 0, total: 0 });
  });
  it('per-week habits count while the target is unmet', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 3 } });
    expect(dayProgress([p], { p: done('2026-10-05') }, TODAY)).toEqual({ done: 0, total: 1 });
  });
  it('per-week habits done today still count', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 1 } });
    expect(dayProgress([p], { p: done('2026-10-08') }, TODAY)).toEqual({ done: 1, total: 1 });
  });
  it('skips archived habits and habits not started yet', () => {
    const arch = habit({ id: 'x', archivedAt: '2026-10-01' });
    const future = habit({ id: 'y', createdAt: d('2026-10-20') });
    expect(dayProgress([arch, future], {}, TODAY)).toEqual({ done: 0, total: 0 });
  });
});
