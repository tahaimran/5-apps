import { summarize, totalAcross, totalCheckIns, weekBars } from '../stats';
import { d, done, habit } from '../testHelpers';

const TODAY = d('2026-10-08');

describe('totalCheckIns', () => {
  it('counts completed days only', () => {
    const water = habit({ type: 'count', target: 8 });
    const e = { '2026-10-06': { value: 8, updatedAt: 0 }, '2026-10-07': { value: 3, updatedAt: 0 } } as never;
    expect(totalCheckIns(water, e)).toBe(1);
  });
  it('includes bonus days and ignores entries before the start', () => {
    const h = habit({ createdAt: d('2026-10-05') });
    expect(totalCheckIns(h, done('2026-10-01', '2026-10-05', '2026-10-06'))).toBe(2);
  });
});

describe('weekBars', () => {
  const a = habit({ id: 'a' });
  const b = habit({ id: 'b' });
  const bars = weekBars([a, b], { a: done('2026-10-05', '2026-10-06', '2026-10-08'), b: done('2026-10-05') }, TODAY, 1);

  it('has one bar per day of the week', () => {
    expect(bars.map((x) => x.day)[0]).toBe('2026-10-05');
    expect(bars).toHaveLength(7);
  });
  it('computes the done ratio per day', () => {
    expect(bars[0]).toMatchObject({ done: 2, total: 2, ratio: 1 });
    expect(bars[1]).toMatchObject({ done: 1, total: 2, ratio: 0.5 });
  });
  it('marks days after today as future with no bar', () => {
    expect(bars[5]).toMatchObject({ isFuture: true, total: 0, ratio: 0 });
  });
});

describe('summarize', () => {
  it('sorts by current streak then best', () => {
    const a = habit({ id: 'a', name: 'A' });
    const b = habit({ id: 'b', name: 'B' });
    const c = habit({ id: 'c', name: 'C', archivedAt: '2026-10-01' });
    const s = summarize([a, b, c], { a: done('2026-10-07'), b: done('2026-10-06', '2026-10-07', '2026-10-08'), c: done('2026-10-08') }, TODAY, 1);
    expect(s.map((x) => x.habit.id)).toEqual(['b', 'a']);
    expect(s[0]).toMatchObject({ current: 3, best: 3, total: 3, unit: 'days' });
    expect(totalAcross(s)).toBe(4);
  });
  it('reports per-week habits in weeks', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 1 } });
    expect(summarize([p], { p: done('2026-10-06') }, TODAY, 1)[0]).toMatchObject({ current: 1, unit: 'weeks' });
  });
});
