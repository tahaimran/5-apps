import { addDays, dayRange } from './dayKey';
import { settledStage } from './plant';
import type { DayKey, DaySummary, PlantProgress } from './types';

export const MAX_FREEZES = 2;
/** Older gaps are treated as one long miss; nobody's streak survives 400 idle days. */
const MAX_CATCH_UP_DAYS = 400;

export interface Evaluation {
  progress: PlantProgress;
  /** Days a streak freeze was spent on, oldest first (shown as a toast on next open). */
  freezeDays: DayKey[];
}

/**
 * Closes every logical day before `today` that has not been evaluated yet (plan §8.6): a reached
 * day adds to the streak and the goal-day counter; a missed day spends a freeze if there is a
 * streak to keep and one to spend, otherwise the streak resets. Never touches `today`.
 */
export function evaluateDays(progress: PlantProgress, summaries: Record<DayKey, DaySummary>, today: DayKey): Evaluation {
  const yesterday = addDays(today, -1);
  let days = dayRange(addDays(progress.lastEvaluatedDay, 1), yesterday);
  let { streak, bestStreak, streakFreezes, goalDays } = progress;
  const freezeDays: DayKey[] = [];

  if (days.length > MAX_CATCH_UP_DAYS) {
    days = days.slice(-MAX_CATCH_UP_DAYS);
    streak = 0;
  }
  for (const day of days) {
    if (summaries[day]?.reached) {
      streak += 1;
      goalDays += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else if (streak > 0 && streakFreezes > 0) {
      streakFreezes -= 1;
      freezeDays.push(day);
    } else {
      streak = 0;
    }
  }
  if (days.length === 0) return { progress, freezeDays };
  return {
    progress: {
      ...progress,
      streak,
      bestStreak,
      streakFreezes,
      goalDays,
      stage: settledStage(progress, goalDays),
      lastEvaluatedDay: yesterday,
    },
    freezeDays,
  };
}

/** Progress as the user sees it today: today's reached goal already counts. */
export function liveProgress(progress: PlantProgress, todayReached: boolean): PlantProgress {
  if (!todayReached) return progress;
  const streak = progress.streak + 1;
  const goalDays = progress.goalDays + 1;
  return { ...progress, streak, bestStreak: Math.max(progress.bestStreak, streak), goalDays, stage: settledStage(progress, goalDays) };
}

export const addFreeze = (progress: PlantProgress): PlantProgress => ({
  ...progress,
  streakFreezes: Math.min(MAX_FREEZES, progress.streakFreezes + 1),
});
