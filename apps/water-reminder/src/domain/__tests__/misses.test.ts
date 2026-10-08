import { MISSED_AFTER_MS, shouldOfferGuide, suspectedMisses } from '../misses';
import type { ScheduledReminder } from '../types';

const NOW = 10_000_000;
const slot = (i: number, fireAt: number, kind: ScheduledReminder['kind'] = 'slot'): ScheduledReminder => ({ notificationId: `reminder:${i}`, fireAt, kind });

describe('suspected missed reminders (plan §10.5)', () => {
  it('counts reminders that are past due but still pending', () => {
    const scheduled = [slot(0, NOW - MISSED_AFTER_MS - 1), slot(1, NOW - 60_000), slot(2, NOW + 60_000)];
    const pending = new Set(['reminder:0', 'reminder:1', 'reminder:2']);
    expect(suspectedMisses(scheduled, pending, NOW).map((s) => s.notificationId)).toEqual(['reminder:0']);
  });
  it('does not count one that fired (no longer pending)', () => {
    expect(suspectedMisses([slot(0, NOW - 3_600_000)], new Set(), NOW)).toEqual([]);
  });
  it('ignores snoozes', () => {
    expect(suspectedMisses([slot(0, NOW - 3_600_000, 'snooze')], new Set(['reminder:0']), NOW)).toEqual([]);
  });
  it('offers the guide after two misses, once', () => {
    expect(shouldOfferGuide(1, false)).toBe(false);
    expect(shouldOfferGuide(2, false)).toBe(true);
    expect(shouldOfferGuide(5, true)).toBe(false);
  });
});
