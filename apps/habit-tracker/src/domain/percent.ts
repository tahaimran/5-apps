import type { DayKey, Habit, HabitId } from './types';
import { addDays, startOfWeek } from './dayKey';
import { isActiveOn, isScheduledOn } from './schedule';
import { dayStatus, weekCount, type Entries, type StreakHabit } from './streaks';

/**
 * Completion over the last `window` days (or since the start date for 'all'), from 0 to 1, or
 * null when the window has no scheduled days. Frozen days count neither as done nor as missed.
 * "X per week" habits sum min(completions, X) over the weeks touched, divided by X per week.
 */
export function habitCompletion(
  habit: StreakHabit,
  entries: Entries,
  today: DayKey,
  window: number | 'all',
  weekStartsOn: 0 | 1 = 1,
): number | null {
  const from =
    window === 'all' || addDays(today, -(window - 1)) < habit.createdAt
      ? habit.createdAt
      : addDays(today, -(window - 1));
  if (from > today) return null;

  if (habit.schedule.kind === 'perWeek') {
    const { times } = habit.schedule;
    const currentWeek = startOfWeek(today, weekStartsOn);
    let done = 0;
    let weeks = 0;
    for (let w = startOfWeek(from, weekStartsOn); w <= currentWeek; w = addDays(w, 7)) {
      const through = w === currentWeek ? today : addDays(w, 6);
      done += Math.min(weekCount(habit, entries, through, weekStartsOn), times);
      weeks++;
    }
    return done / (times * weeks);
  }

  let done = 0;
  let total = 0;
  for (let d = from; d <= today; d = addDays(d, 1)) {
    if (!isScheduledOn(habit.schedule, d)) continue;
    const status = dayStatus(habit, entries, d);
    if (status === 'frozen') continue;
    total++;
    if (status === 'complete') done++;
  }
  return total === 0 ? null : done / total;
}

export interface DayProgress {
  done: number;
  total: number;
}

/**
 * Today's ring. Per-week habits only count while their weekly target is unmet, or when done
 * today.
 */
export function dayProgress(
  habits: Pick<Habit, 'id' | 'type' | 'target' | 'schedule' | 'createdAt' | 'archivedAt'>[],
  entries: Record<HabitId, Entries>,
  day: DayKey,
  weekStartsOn: 0 | 1 = 1,
): DayProgress {
  let done = 0;
  let total = 0;
  for (const habit of habits) {
    if (!isActiveOn(habit, day)) continue;
    const habitEntries = entries[habit.id] ?? {};
    const complete = dayStatus(habit, habitEntries, day) === 'complete';
    if (habit.schedule.kind === 'perWeek') {
      if (complete) {
        done++;
        total++;
      } else if (weekCount(habit, habitEntries, day, weekStartsOn) < habit.schedule.times) {
        total++;
      }
      continue;
    }
    if (!isScheduledOn(habit.schedule, day)) continue;
    total++;
    if (complete) done++;
  }
  return { done, total };
}
