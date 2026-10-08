import type { Activity, Climate, Mode, Profile, Sex } from './types';
import { clamp, roundTo } from './units';

export const GOAL_MIN_ML = 1200;
export const GOAL_MAX_ML = 4500;
export const ML_PER_KG = 33;

export const ACTIVITY_ML: Record<Activity, number> = { sedentary: 0, light: 250, active: 500, very_active: 750 };
export const CLIMATE_ML: Record<Climate, number> = { cool: -100, mild: 0, warm: 250, hot: 500 };
export const SEX_ML: Record<Sex, number> = { female: 0, male: 150, unspecified: 0 };
/** EFSA increments; senior and fasting do not change the goal. */
export const MODE_ML: Record<Mode, number> = { standard: 0, pregnancy: 300, breastfeeding: 700, senior: 0, fasting: 0 };

export interface GoalBreakdown {
  baseMl: number;
  activityMl: number;
  climateMl: number;
  sexMl: number;
  modeMl: number;
  rawMl: number;
  goalMl: number;
}

/** General wellness estimate (plan §8.1), not medical advice. */
export function goalBreakdown(p: Profile): GoalBreakdown {
  const baseMl = p.weightKg * ML_PER_KG;
  const activityMl = ACTIVITY_ML[p.activity];
  const climateMl = CLIMATE_ML[p.climate];
  const sexMl = SEX_ML[p.sex ?? 'unspecified'];
  const modeMl = MODE_ML[p.mode];
  const rawMl = baseMl + activityMl + climateMl + sexMl + modeMl;
  return { baseMl, activityMl, climateMl, sexMl, modeMl, rawMl, goalMl: clamp(roundTo(rawMl, 50), GOAL_MIN_ML, GOAL_MAX_ML) };
}

export const calcGoalMl = (p: Profile): number => goalBreakdown(p).goalMl;

/** Keeps a hand-typed goal inside the supported range and on a 50 ml step. */
export const clampGoal = (ml: number): number => clamp(roundTo(ml, 50), GOAL_MIN_ML, GOAL_MAX_ML);

/** Roughly how many 250 ml glasses a goal is. */
export const glassesOf = (goalMl: number): number => Math.round(goalMl / 250);
