import { addDays, dayOfYear } from './dateKey';
import type { DateKey } from './types';

export const REMINDER_ID = 'daily-reminder';
/** Plan §11: Android channel `daily`, default importance. */
export const REMINDER_CHANNEL = 'daily';
/** Today and the next 7 days; every app open plans them again, so a player who stops opening gets at most 8 and then silence. */
export const REMINDER_DAYS = 8;
export const COPY_VARIANTS = 4;
export const AT_RISK = { hour: 20, minute: 30 } as const;
export const MIN_STREAK_FOR_RISK = 2;
/** Plan §11: comeback messages on day 3 and day 7 of inactivity. */
export const COMEBACK_DAYS = [3, 7] as const;
export const DEFAULT_REMINDER = { hour: 19, minute: 0 } as const;
export const DEEP_LINK = 'quizora://daily';

export type ReminderKind = 'daily' | 'streak' | 'atRisk' | 'comeback3' | 'comeback7';

export interface PlannedReminder {
  at: Date;
  dateKey: DateKey;
  kind: ReminderKind;
  /** Index of the rotating daily message. */
  variant: number;
  streak: number;
}

/** The local date and time of a day's reminder. */
export const atTime = (dateKey: DateKey, hour: number, minute: number): Date => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
};

export interface PlanInput {
  now: Date;
  /** The local date of `now`, read by the caller at planning time. */
  today: DateKey;
  hour: number;
  minute: number;
  /** Today's Daily Challenge is already played. */
  doneToday: boolean;
  /** The streak as it stands today (after any lapse). */
  streak: number;
  days?: number;
}

/**
 * Plans the next notifications from the stores at this moment (plan §11): at most one per day, at the
 * player's time. Today's is dropped once the Daily is played (or its time has passed). With a streak of
 * 2 or more still to save and a reminder time before 20:30 that has not come yet, today's one becomes the
 * "streak ends at midnight" message at 20:30 instead, so it is still one a day. Days 3 and 7 carry the
 * comeback message. Rescheduled on every open, so it never trusts a value from earlier.
 */
export function planReminders(input: PlanInput): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  const nowMs = input.now.getTime();
  for (let i = 0; i < (input.days ?? REMINDER_DAYS); i++) {
    const dateKey = addDays(input.today, i);
    let at = atTime(dateKey, input.hour, input.minute);
    const variant = dayOfYear(dateKey) % COPY_VARIANTS;
    let kind: ReminderKind = 'daily';
    if (i === 0) {
      if (input.doneToday || at.getTime() <= nowMs) continue;
      const risk = atTime(dateKey, AT_RISK.hour, AT_RISK.minute);
      if (input.streak >= MIN_STREAK_FOR_RISK) {
        if (at.getTime() < risk.getTime()) {
          at = risk;
          kind = 'atRisk';
        } else {
          kind = 'streak';
        }
      }
    } else if (i === COMEBACK_DAYS[0]) kind = 'comeback3';
    else if (i === COMEBACK_DAYS[1]) kind = 'comeback7';
    out.push({ at, dateKey, kind, variant, streak: input.streak });
  }
  return out;
}

/** When to offer the reminder again after a "Not now": once, after the first 3-day streak (plan §6 O7). */
export function shouldReask(a: { reminderEnabled: boolean; declinedAt: number; reaskedAt: number; streak: number }): boolean {
  return !a.reminderEnabled && a.declinedAt > 0 && a.reaskedAt === 0 && a.streak >= 3;
}
