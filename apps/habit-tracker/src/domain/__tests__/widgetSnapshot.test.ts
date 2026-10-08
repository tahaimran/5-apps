import { buildSnapshot, valueAfterAction } from '../widgetSnapshot';
import type { Habit } from '../types';
import { d, done, entry, habit } from '../testHelpers';

const TODAY = d('2026-10-08'); // Thursday

const run = (list: Habit[], entries: Record<string, ReturnType<typeof done>>, day = TODAY) =>
  buildSnapshot({
    habits: Object.fromEntries(list.map((h) => [h.id, h])),
    habitOrder: list.map((h) => h.id),
    entries,
    day,
    weekStartsOn: 1,
    theme: 'light',
    now: 123,
  });

describe('valueAfterAction', () => {
  const yesNo = habit();
  const water = habit({ type: 'count', target: 3 });
  const timer = habit({ type: 'timer', target: 10 });

  it('toggles yes/no habits', () => {
    expect(valueAfterAction(yesNo, undefined, 'TOGGLE')).toBe(1);
    expect(valueAfterAction(yesNo, entry(1), 'TOGGLE')).toBe(0);
  });
  it('increments count habits by one', () => {
    expect(valueAfterAction(water, undefined, 'INCREMENT')).toBe(1);
    expect(valueAfterAction(water, entry(2), 'INCREMENT')).toBe(3);
  });
  it('toggling a count habit completes or clears it', () => {
    expect(valueAfterAction(water, entry(1), 'TOGGLE')).toBe(3);
    expect(valueAfterAction(water, entry(3), 'TOGGLE')).toBe(0);
  });
  it('does not act on timers', () => {
    expect(valueAfterAction(timer, undefined, 'TOGGLE')).toBeNull();
    expect(valueAfterAction(timer, undefined, 'INCREMENT')).toBeNull();
  });
  it('increment does not apply to yes/no', () => {
    expect(valueAfterAction(yesNo, undefined, 'INCREMENT')).toBeNull();
  });
});

describe('buildSnapshot', () => {
  it('lists habits scheduled today in the user order with progress', () => {
    const a = habit({ id: 'a', name: 'A' });
    const b = habit({ id: 'b', name: 'B', type: 'count', target: 8 });
    const snap = run([b, a], { a: done('2026-10-08'), b: { '2026-10-08': entry(3) } as never });
    expect(snap.items.map((i) => i.id)).toEqual(['b', 'a']);
    expect(snap.items[0]).toMatchObject({ value: 3, target: 8, done: false });
    expect(snap).toMatchObject({ doneCount: 1, total: 2, day: TODAY, theme: 'light', generatedAt: 123 });
  });
  it('hides habits not scheduled today and archived or not-yet-started ones', () => {
    const sundays = habit({ id: 's', schedule: { kind: 'weekdays', days: [0] } });
    const archived = habit({ id: 'x', archivedAt: '2026-10-01' });
    const future = habit({ id: 'f', createdAt: d('2026-10-20') });
    expect(run([sundays, archived, future], {}).items).toHaveLength(0);
  });
  it('shows per-week habits only while the target is unmet, or when done today', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 2 } });
    expect(run([p], { p: done('2026-10-05') }).items).toHaveLength(1);
    expect(run([p], { p: done('2026-10-05', '2026-10-06') }).items).toHaveLength(0);
    expect(run([p], { p: done('2026-10-05', '2026-10-08') }).items).toHaveLength(1);
  });
  it('includes the current streak', () => {
    const a = habit({ id: 'a' });
    expect(run([a], { a: done('2026-10-06', '2026-10-07', '2026-10-08') }).items[0].streak).toBe(3);
  });
  it('is empty with no habits', () => {
    expect(run([], {})).toMatchObject({ items: [], doneCount: 0, total: 0 });
  });
});
