import type { Schedule } from '../types';
import { isActiveOn, isScheduledOn } from '../schedule';
import { isComplete, completionRatio } from '../completion';
import { d, entry, habit } from '../testHelpers';

describe('isScheduledOn', () => {
  it('daily is every day', () => {
    expect(isScheduledOn({ kind: 'daily' }, d('2026-10-08'))).toBe(true);
  });
  it('weekdays only on chosen days (0 = Sunday)', () => {
    const s: Schedule = { kind: 'weekdays', days: [1, 3, 5] };
    expect(isScheduledOn(s, d('2026-10-05'))).toBe(true); // Mon
    expect(isScheduledOn(s, d('2026-10-06'))).toBe(false); // Tue
    expect(isScheduledOn(s, d('2026-10-11'))).toBe(false); // Sun
  });
  it('per-week is flexible on any day', () => {
    expect(isScheduledOn({ kind: 'perWeek', times: 3 }, d('2026-10-08'))).toBe(true);
  });
});

describe('isActiveOn', () => {
  it('ignores days before the start date', () => {
    const h = habit({ createdAt: d('2026-10-05') });
    expect(isActiveOn(h, d('2026-10-04'))).toBe(false);
    expect(isActiveOn(h, d('2026-10-05'))).toBe(true);
  });
  it('excludes archived habits', () => {
    expect(isActiveOn(habit({ archivedAt: '2026-10-07' }), d('2026-10-08'))).toBe(false);
  });
});

describe('completion', () => {
  it('yes/no needs value 1', () => {
    const h = habit();
    expect(isComplete(h, undefined)).toBe(false);
    expect(isComplete(h, entry(0))).toBe(false);
    expect(isComplete(h, entry(1))).toBe(true);
  });
  it('count needs value >= target', () => {
    const h = habit({ type: 'count', target: 8 });
    expect(isComplete(h, entry(7))).toBe(false);
    expect(isComplete(h, entry(8))).toBe(true);
    expect(isComplete(h, entry(10))).toBe(true);
  });
  it('timer compares seconds to target minutes', () => {
    const h = habit({ type: 'timer', target: 10 });
    expect(isComplete(h, entry(599))).toBe(false);
    expect(isComplete(h, entry(600))).toBe(true);
  });
  it('ratio is clamped to 0..1', () => {
    const h = habit({ type: 'count', target: 8 });
    expect(completionRatio(h, entry(4))).toBe(0.5);
    expect(completionRatio(h, entry(20))).toBe(1);
    expect(completionRatio(h, undefined)).toBe(0);
    expect(completionRatio(habit({ type: 'timer', target: 10 }), entry(300))).toBe(0.5);
    expect(completionRatio(habit(), entry(1))).toBe(1);
  });
});
