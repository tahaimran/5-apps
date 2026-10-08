import { elapsedSeconds } from './timer';
import type { Entry, Habit } from './types';

type Completable = Pick<Habit, 'type' | 'target'>;

/**
 * yes/no: value >= 1. count: value >= target. timer: seconds >= target minutes. Pass `now` to
 * include the time of a timer that is still running; streaks leave it out until it is paused.
 */
export function isComplete(habit: Completable, entry: Entry | undefined, now?: number): boolean {
  if (!entry) return false;
  switch (habit.type) {
    case 'boolean':
      return entry.value >= 1;
    case 'count':
      return entry.value >= habit.target;
    case 'timer':
      return (now === undefined ? entry.value : elapsedSeconds(entry, now)) >= habit.target * 60;
  }
}

/** 0..1 progress for heatmap shading and rings. */
export function completionRatio(habit: Completable, entry: Entry | undefined): number {
  if (!entry || entry.value <= 0) return 0;
  const target = habit.type === 'boolean' ? 1 : habit.type === 'timer' ? habit.target * 60 : habit.target;
  return Math.min(entry.value / target, 1);
}
