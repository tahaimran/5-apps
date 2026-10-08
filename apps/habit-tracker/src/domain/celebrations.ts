import type { DayKey, HabitId } from './types';

export const MILESTONES = [3, 7, 14, 30, 50, 100, 365] as const;

export interface CelebrationSnapshot {
  day: DayKey;
  /** Current streak per habit. */
  streaks: Record<HabitId, number>;
  /** Completed check-ins across all habits. */
  totalCheckIns: number;
  /** Everything scheduled today is done (and there was something to do). */
  allDone: boolean;
}

/** What has already been celebrated, so undo/redo cannot trigger confetti twice. */
export interface CelebratedState {
  first?: boolean;
  perfectDay?: DayKey;
  /** Highest milestone celebrated per habit. */
  milestones?: Record<HabitId, number>;
}

export type Celebration =
  | { kind: 'first' }
  | { kind: 'milestone'; habitId: HabitId; milestone: number }
  | { kind: 'perfectDay' };

/** Highest milestone reached by going from `prev` to `next`, if any. */
export function milestoneCrossed(prev: number, next: number): number | null {
  const hit = MILESTONES.filter((m) => prev < m && next >= m);
  return hit.length ? hit[hit.length - 1] : null;
}

/**
 * Compares two consecutive snapshots and says what to celebrate, if anything:
 * the very first check-in, a streak milestone, or the first perfect day of the day.
 * Priority is first > milestone > perfect day. Returns the updated celebrated state too.
 */
export function detectCelebration(
  prev: CelebrationSnapshot,
  next: CelebrationSnapshot,
  celebrated: CelebratedState,
): { celebration: Celebration | null; celebrated: CelebratedState } {
  if (prev.day !== next.day) return { celebration: null, celebrated };

  if (!celebrated.first && prev.totalCheckIns === 0 && next.totalCheckIns > 0) {
    return { celebration: { kind: 'first' }, celebrated: { ...celebrated, first: true } };
  }

  for (const [habitId, streak] of Object.entries(next.streaks)) {
    const milestone = milestoneCrossed(prev.streaks[habitId] ?? 0, streak);
    if (milestone !== null && milestone > (celebrated.milestones?.[habitId] ?? 0)) {
      return {
        celebration: { kind: 'milestone', habitId, milestone },
        celebrated: { ...celebrated, milestones: { ...celebrated.milestones, [habitId]: milestone } },
      };
    }
  }

  if (!prev.allDone && next.allDone && celebrated.perfectDay !== next.day) {
    return { celebration: { kind: 'perfectDay' }, celebrated: { ...celebrated, perfectDay: next.day } };
  }
  return { celebration: null, celebrated };
}
