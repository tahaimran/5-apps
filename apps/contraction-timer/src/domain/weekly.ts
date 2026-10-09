import { addDays } from './dateKey';
import { startOfWeek } from './dueDate';
import { FIRST_WEEK, LAST_WEEK, weekCard } from './weeks';
import type { DateKey } from './types';

/** Plan §10: the card arrives at 10:00 local on the first day of each pregnancy week. */
export const WEEKLY_HOUR = 10;
/** Plan §10: notifications stop 21 days after the due date. */
export const STOP_AFTER_DUE_DAYS = 21;

export interface WeeklyCard {
  week: number;
  at: Date;
  size: string;
  emoji: string;
}

/** The local date and time of 10:00 on a day. */
const at10 = (key: DateKey): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, WEEKLY_HOUR, 0, 0, 0);
};

/**
 * The size cards still to come, one per pregnancy week from `now`, and none once the due date is more than 21 days gone.
 * `now` is passed in by the caller (read when the plan is made, never kept).
 */
export function upcomingWeeklyCards(edd: DateKey, now: Date): WeeklyCard[] {
  const stopAfter = at10(addDays(edd, STOP_AFTER_DUE_DAYS + 1));
  const out: WeeklyCard[] = [];
  for (let week = FIRST_WEEK; week <= LAST_WEEK; week++) {
    const at = at10(startOfWeek(edd, week));
    if (at.getTime() <= now.getTime() || at.getTime() >= stopAfter.getTime()) continue;
    const card = weekCard(week);
    if (card) out.push({ week, at, size: card.size, emoji: card.emoji ?? '' });
  }
  return out;
}
