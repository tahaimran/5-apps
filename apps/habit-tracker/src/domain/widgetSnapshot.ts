import { isComplete } from './completion';
import { isActiveOn, isScheduledOn } from './schedule';
import { computeStreaks, weekCount, type Entries } from './streaks';
import type { DayKey, Entry, Habit, HabitId, WidgetSnapshot } from './types';

export type WidgetAction = 'TOGGLE' | 'INCREMENT';

type SnapshotHabit = Pick<Habit, 'id' | 'name' | 'icon' | 'color' | 'type' | 'target' | 'schedule' | 'createdAt' | 'archivedAt'>;

/**
 * New stored value for a tap on the widget, or null when the action does not apply (timers
 * open the app instead). Yes/no toggles; a count habit adds one.
 */
export function valueAfterAction(habit: Pick<Habit, 'type' | 'target'>, entry: Entry | undefined, action: WidgetAction): number | null {
  const value = entry?.value ?? 0;
  if (action === 'TOGGLE') {
    if (habit.type === 'boolean') return value >= 1 ? 0 : 1;
    if (habit.type === 'count') return isComplete(habit, entry) ? 0 : habit.target;
    return null;
  }
  return habit.type === 'count' ? value + 1 : null;
}

/** What the widget shows: the habits for `day`, in the user's order, with progress. */
export function buildSnapshot(args: {
  habits: Record<HabitId, SnapshotHabit>;
  habitOrder: HabitId[];
  entries: Record<HabitId, Entries>;
  day: DayKey;
  weekStartsOn: 0 | 1;
  theme: 'light' | 'dark';
  now: number;
}): WidgetSnapshot {
  const { habits, habitOrder, entries, day, weekStartsOn, theme, now } = args;
  const items: WidgetSnapshot['items'] = [];
  for (const id of habitOrder) {
    const habit = habits[id];
    if (!habit || !isActiveOn(habit, day)) continue;
    const e = entries[id] ?? {};
    const entry = e[day];
    const done = isComplete(habit, entry);
    const show =
      habit.schedule.kind === 'perWeek'
        ? done || weekCount(habit, e, day, weekStartsOn) < habit.schedule.times
        : isScheduledOn(habit.schedule, day);
    if (!show) continue;
    items.push({
      id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      type: habit.type,
      value: entry?.value ?? 0,
      target: habit.target,
      done,
      streak: computeStreaks(habit, e, day, weekStartsOn).current,
    });
  }
  return { day, theme, items, doneCount: items.filter((i) => i.done).length, total: items.length, generatedAt: now };
}
