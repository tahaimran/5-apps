import type { PlantProgress, PlantStage } from './types';

/** Cumulative goal-days needed for each stage (plan §7.3). Stage 5, the Tree of Life, is v2. */
export const STAGE_GOAL_DAYS: readonly number[] = [0, 1, 4, 10, 21];
export const MAX_STAGE: PlantStage = 4;

export type Mood = 'thirsty' | 'ok' | 'happy' | 'sparkle';

export function stageForGoalDays(goalDays: number): PlantStage {
  let stage = 0;
  STAGE_GOAL_DAYS.forEach((needed, i) => {
    if (goalDays >= needed) stage = i;
  });
  return stage as PlantStage;
}

/** Today's mood from the percent of the goal. A missed day only droops the plant for that day. */
export function moodFor(percent: number): Mood {
  if (percent >= 100) return 'sparkle';
  if (percent >= 75) return 'happy';
  if (percent >= 25) return 'ok';
  return 'thirsty';
}

export interface NextStage {
  stage: PlantStage;
  /** Goal days still needed, and the days already gathered towards it. */
  remaining: number;
  have: number;
  need: number;
}

/** What is next for a plant with `goalDays`, or null once it is fully grown. */
export function nextStage(goalDays: number): NextStage | null {
  const current = stageForGoalDays(goalDays);
  if (current >= MAX_STAGE) return null;
  const need = STAGE_GOAL_DAYS[current + 1] - STAGE_GOAL_DAYS[current];
  const have = goalDays - STAGE_GOAL_DAYS[current];
  return { stage: (current + 1) as PlantStage, remaining: need - have, have, need };
}

/** A stage never goes back (plan §18), even if edits later lower the goal-day count. */
export const settledStage = (progress: Pick<PlantProgress, 'stage'>, goalDays: number): PlantStage =>
  Math.max(progress.stage, stageForGoalDays(goalDays)) as PlantStage;
