import { addDays, dayOfYear } from './dateKey';
import { dailyPackId } from './daily';
import type { DateKey, ReminderPrompt } from './types';

export const REMINDER_ID = 'daily-reminder';
export const REMINDER_CHANNEL = 'daily-puzzle';
/** How many days ahead notifications are scheduled; each app open plans them again. */
export const REMINDER_DAYS = 7;
export const ASK_AGAIN_AFTER_MS = 7 * 86_400_000;
export const MAX_ASKS = 2;
export const COMPLETIONS_BEFORE_ASK = 3;

/** The time chips of the pre-prompt (plan §10); "Choose time" is the stepper. */
export const TIME_CHOICES = [
  { hour: 9, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 19, minute: 0 },
] as const;

/** Number of rotating, guilt-free messages (`reminder.copy.0` … in en.json). */
export const COPY_VARIANTS = 4;

export interface PlannedReminder {
  at: Date;
  dateKey: DateKey;
  /** Index of the message for that day. */
  variant: number;
  packId: string;
}

/** The local date and time of a day's reminder. */
export const atTime = (dateKey: DateKey, hour: number, minute: number): Date => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
};

/**
 * The next reminders: one a day, never more (plan §10). Today's is left out when its time has
 * passed or when today's daily puzzle is already done. Planned again on every open, so a player
 * who stops opening the app gets at most REMINDER_DAYS of them and then silence.
 */
export function planReminders(input: { now: Date; today: DateKey; hour: number; minute: number; doneToday: boolean; days?: number }): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  for (let i = 0; i < (input.days ?? REMINDER_DAYS); i++) {
    const dateKey = addDays(input.today, i);
    const at = atTime(dateKey, input.hour, input.minute);
    if (at.getTime() <= input.now.getTime()) continue;
    if (i === 0 && input.doneToday) continue;
    out.push({ at, dateKey, variant: dayOfYear(dateKey) % COPY_VARIANTS, packId: dailyPackId(dateKey) });
  }
  return out;
}

export interface AskInput {
  prompt: ReminderPrompt;
  reminderEnabled: boolean;
  now: number;
  /** The player just finished a daily puzzle that counted (first daily completion). */
  dailyJustCompleted: boolean;
  tutorial: boolean;
}

/**
 * Plan §10: ask after the first daily completion or the 3rd completed puzzle, whichever comes
 * first; never on first launch or after the tutorial; "Not now" asks again once after 7 days.
 */
export function shouldAskReminder(a: AskInput): boolean {
  if (a.tutorial || a.reminderEnabled) return false;
  if (a.prompt.askCount >= MAX_ASKS) return false;
  if (a.prompt.askCount === 1 && a.now - a.prompt.askedAt < ASK_AGAIN_AFTER_MS) return false;
  return a.dailyJustCompleted || a.prompt.completions >= COMPLETIONS_BEFORE_ASK;
}
