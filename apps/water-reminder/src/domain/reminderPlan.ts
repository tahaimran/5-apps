import { addDays, atMinute, dayKeyFor, localDateKey, MIN_PER_DAY, weekdayOf } from './dayKey';
import { buildSlots } from './schedule';
import type { DayKey, MinuteOfDay, ReminderSettings } from './types';

/** Today's remaining slots plus the next two days (plan §10.2). */
export const HORIZON_DAYS = 3;
/** 16 slots x 3 days; far below Android's 500-alarm cap. */
export const MAX_PENDING = 48;
export const MESSAGE_COUNT = 8;

export interface PlannedReminder {
  at: Date;
  /** The slot as minutes from the wake-up date's midnight (>= 1440 after midnight). */
  slotMin: MinuteOfDay;
  /** Logical day the reminder belongs to. */
  day: DayKey;
  /** `misses` is the soft "your plant misses you" message that ends a long silence. */
  kind: 'slot' | 'misses';
  /** Index into the rotating friendly lines (`notify.messages.<n>`). */
  messageIndex: number;
}

export interface PlanInput {
  now: Date;
  reminders: ReminderSettings;
  goalMl: number;
  /** Preferred cup, used to size the smart schedule. */
  cupMl: number;
  /** Timestamps of recent drinks (today and last night are enough). */
  logTimes: number[];
  /** Today's goal is already reached: nothing more is planned for today. */
  todayReached: boolean;
}

/**
 * Plans the reminders to schedule next as one-off notifications (rolling horizon). Rules, in order:
 *  - none when reminders are off, on a day that is switched off, or outside wake + 30 / bed - 30;
 *  - auto-skip: a slot is dropped when a drink was logged up to `skipWindowMin` before it;
 *  - once today's goal is reached, nothing is left for today;
 *  - the very last one gets the gentle "misses you" message, because it only fires if the user
 *    stays away for days (any app open re-plans and pushes it out).
 */
export function planReminders(input: PlanInput): PlannedReminder[] {
  const { now, reminders: s } = input;
  if (!s.enabled) return [];
  const slots = buildSlots(s, input.goalMl, input.cupMl);
  const today = dayKeyFor(now, s.wakeMin);
  const skipMs = s.skipWindowMin * 60_000;
  const calendarToday = localDateKey(now);
  const planned: PlannedReminder[] = [];

  // Anchor -1 carries an overnight schedule's after-midnight slots into this morning.
  for (let offset = -1; offset < HORIZON_DAYS; offset++) {
    const anchor = addDays(calendarToday, offset);
    if (!s.activeWeekdays.includes(weekdayOf(anchor))) continue;
    for (const [slotIndex, slotMin] of slots.entries()) {
      if (offset === -1 && slotMin < MIN_PER_DAY) continue;
      const at = atMinute(anchor, slotMin);
      if (at.getTime() <= now.getTime()) continue;
      const day = dayKeyFor(at, s.wakeMin);
      if (day === today && input.todayReached) continue;
      if (input.logTimes.some((l) => at.getTime() - l >= 0 && at.getTime() - l <= skipMs)) continue;
      planned.push({ at, slotMin, day, kind: 'slot', messageIndex: (Math.floor(at.getTime() / 86_400_000) * 5 + slotIndex) % MESSAGE_COUNT });
    }
  }
  planned.sort((a, b) => a.at.getTime() - b.at.getTime());
  const kept = planned.slice(0, MAX_PENDING);
  if (kept.length > 0) kept[kept.length - 1] = { ...kept[kept.length - 1], kind: 'misses' };
  return kept;
}

/**
 * When a "Snooze" tap should fire again, or null when it would land after bedtime (or the tap
 * came outside the waking window). Plan §8.3.
 */
export function planSnooze(now: Date, s: Pick<ReminderSettings, 'wakeMin' | 'bedMin' | 'snoozeMin'>): Date | null {
  const at = new Date(now.getTime() + s.snoozeMin * 60_000);
  const calendarToday = localDateKey(now);
  for (const offset of [-1, 0]) {
    const anchor = addDays(calendarToday, offset);
    const start = atMinute(anchor, s.wakeMin).getTime();
    const end = atMinute(anchor, s.bedMin <= s.wakeMin ? s.bedMin + MIN_PER_DAY : s.bedMin).getTime();
    if (now.getTime() >= start && now.getTime() <= end) return at.getTime() <= end ? at : null;
  }
  return null;
}
