import type { DayKey, Habit, Schedule } from './types';
import { weekdayOf } from './dayKey';

/**
 * Whether a schedule puts the habit on `day`. "X per week" habits are flexible: any day can
 * count, so they are never "not scheduled".
 */
export function isScheduledOn(schedule: Schedule, day: DayKey): boolean {
  switch (schedule.kind) {
    case 'daily':
    case 'perWeek':
      return true;
    case 'weekdays':
      return schedule.days.includes(weekdayOf(day));
  }
}

/** Habits ignore days before their start date. */
export function isActiveOn(habit: Pick<Habit, 'createdAt' | 'archivedAt'>, day: DayKey): boolean {
  return day >= habit.createdAt && !habit.archivedAt;
}
