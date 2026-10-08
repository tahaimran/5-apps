import { defaultCups, defaultProfile, DEFAULT_BED_MIN, DEFAULT_CUP_ID, DEFAULT_GOAL_ML, DEFAULT_WAKE_MIN } from '@/domain/defaults';
import { calcGoalMl, clampGoal } from '@/domain/goal';
import type { Activity, Climate, Cup, GoalSettings, Profile, ReminderSettings, Sex } from '@/domain/types';
import { lbToKg } from '@/domain/units';

/** What the onboarding steps collect, keyed by step (plan §6). Every field is optional: skipping uses defaults. */
export interface OnboardingAnswers {
  about?: Sex;
  weight?: { unit: 'kg' | 'lb'; value: number };
  schedule?: { wakeMin: number; bedMin: number };
  activity?: Activity;
  climate?: Climate;
  /** The goal reveal: a hand-adjusted goal, if the user pressed Adjust. */
  goal?: { adjustedMl?: number; adjusting?: boolean };
  /** "I already know my goal" jumps past the questions and asks for the goal on the cup step. */
  knowsGoal?: boolean;
  cup?: { ml: number; goalMl?: number };
  reminders?: { frequency: 'smart' | 'interval60' | 'interval120'; style: 'gentle' | 'normal' };
  permission?: 'granted' | 'denied' | 'skipped';
  firstGlass?: { logged: boolean; ml: number };
  /** Set by Skip: the remaining questions use their defaults. */
  skipped?: boolean;
}

export const DEFAULT_WEIGHT = { kg: 65, lb: 145 } as const;
export const WEIGHT_RANGE = { kg: { min: 30, max: 200 }, lb: { min: 66, max: 440 } } as const;
export const CUP_SIZES = [150, 250, 350, 500] as const;

export interface ResolvedOnboarding {
  profile: Profile;
  goal: Pick<GoalSettings, 'goalMl' | 'source'>;
  reminders: Pick<ReminderSettings, 'wakeMin' | 'bedMin' | 'frequency' | 'intervalMin' | 'style'>;
  cups: Cup[];
  preferredCupId: string;
}

export function weightKgOf(a: OnboardingAnswers, fallbackUnit: 'kg' | 'lb'): { kg: number; unit: 'kg' | 'lb' } {
  const unit = a.weight?.unit ?? fallbackUnit;
  const value = a.weight?.value ?? DEFAULT_WEIGHT[unit];
  return { kg: unit === 'kg' ? value : lbToKg(value), unit };
}

/** The profile the goal calculator sees, from the answers so far. */
export function profileFrom(a: OnboardingAnswers, fallbackUnit: 'kg' | 'lb'): Profile {
  const { kg, unit } = weightKgOf(a, fallbackUnit);
  return {
    ...defaultProfile,
    sex: a.about ?? 'unspecified',
    weightKg: kg,
    weightUnit: unit,
    activity: a.activity ?? defaultProfile.activity,
    climate: a.climate ?? defaultProfile.climate,
  };
}

/** The goal the reveal shows before any adjusting. */
export const calculatedGoal = (a: OnboardingAnswers, fallbackUnit: 'kg' | 'lb'): number => calcGoalMl(profileFrom(a, fallbackUnit));

/** The cups with the chosen size made preferred; a custom size takes the place of the nearest cup. */
export function cupsFor(ml: number): { cups: Cup[]; preferredCupId: string } {
  const exact = defaultCups.find((c) => c.ml === ml);
  if (exact) return { cups: defaultCups, preferredCupId: exact.id };
  const nearest = [...defaultCups].sort((x, y) => Math.abs(x.ml - ml) - Math.abs(y.ml - ml))[0];
  const custom: Cup = { id: 'cup-custom', ml, label: 'custom', icon: nearest.icon };
  return { cups: defaultCups.map((c) => (c.id === nearest.id ? custom : c)), preferredCupId: custom.id };
}

/** Turns the answers into the settings to save, using plan defaults for anything skipped. */
export function resolveAnswers(a: OnboardingAnswers, fallbackUnit: 'kg' | 'lb'): ResolvedOnboarding {
  const profile = profileFrom(a, fallbackUnit);
  const calculated = calcGoalMl(profile);
  let goal: ResolvedOnboarding['goal'];
  if (a.knowsGoal) goal = { goalMl: clampGoal(a.cup?.goalMl ?? DEFAULT_GOAL_ML), source: 'manual' };
  else if (a.goal?.adjustedMl !== undefined && a.goal.adjustedMl !== calculated) goal = { goalMl: clampGoal(a.goal.adjustedMl), source: 'manual' };
  else goal = { goalMl: calculated, source: 'calculated' };

  const freq = a.reminders?.frequency ?? 'smart';
  const { cups, preferredCupId } = a.cup ? cupsFor(a.cup.ml) : { cups: defaultCups, preferredCupId: DEFAULT_CUP_ID };
  return {
    profile,
    goal,
    reminders: {
      wakeMin: a.schedule?.wakeMin ?? DEFAULT_WAKE_MIN,
      bedMin: a.schedule?.bedMin ?? DEFAULT_BED_MIN,
      frequency: freq === 'smart' ? 'smart' : 'interval',
      intervalMin: freq === 'interval60' ? 60 : 120,
      style: a.reminders?.style ?? 'normal',
    },
    cups,
    preferredCupId,
  };
}
