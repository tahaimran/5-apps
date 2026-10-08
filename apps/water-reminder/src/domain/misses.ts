import type { ScheduledReminder } from './types';

/** A reminder still listed as pending this long after its time never fired (the OS dropped it). */
export const MISSED_AFTER_MS = 10 * 60_000;
/** After this many suspected misses the battery guide is offered once (plan §10.5). */
export const MISSES_BEFORE_GUIDE = 2;

/**
 * Reminders that should have gone off but are still pending: on phones that kill background
 * work, the scheduled alarm is dropped and the notification stays in the pending list. Returns the
 * ones to count as suspected misses (older than `MISSED_AFTER_MS`, and not a snooze that was
 * cancelled on purpose).
 */
export function suspectedMisses(scheduled: ScheduledReminder[], pendingIds: ReadonlySet<string>, now: number): ScheduledReminder[] {
  return scheduled.filter((s) => s.kind === 'slot' && s.fireAt < now - MISSED_AFTER_MS && pendingIds.has(s.notificationId));
}

/** Whether to show the battery guide now: enough misses, and never twice. */
export const shouldOfferGuide = (misses: number, alreadyOffered: boolean): boolean => !alreadyOffered && misses >= MISSES_BEFORE_GUIDE;
