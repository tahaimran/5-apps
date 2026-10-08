import type { AppMeta, Cup, DayKey, GoalSettings, PlantProgress, Prefs, Profile, ReminderSettings } from './types';

export const DEFAULT_GOAL_ML = 2000;
export const DEFAULT_WAKE_MIN = 7 * 60;
export const DEFAULT_BED_MIN = 23 * 60;

export const defaultProfile: Profile = {
  sex: 'unspecified',
  weightKg: 65,
  weightUnit: 'kg',
  activity: 'light',
  climate: 'mild',
  mode: 'standard',
};

export const defaultGoal = (now = Date.now()): GoalSettings => ({ goalMl: DEFAULT_GOAL_ML, source: 'calculated', unit: 'ml', updatedAt: now });

export const defaultReminders: ReminderSettings = {
  enabled: true,
  wakeMin: DEFAULT_WAKE_MIN,
  bedMin: DEFAULT_BED_MIN,
  frequency: 'smart',
  intervalMin: 120,
  style: 'normal',
  snoozeMin: 15,
  skipWindowMin: 30,
  quietBlocks: [],
  activeWeekdays: [0, 1, 2, 3, 4, 5, 6],
};

export const defaultCups: Cup[] = [
  { id: 'cup-150', ml: 150, label: 'small', icon: 'cup-water' },
  { id: 'cup-250', ml: 250, label: 'glass', icon: 'cup-water' },
  { id: 'cup-350', ml: 350, label: 'mug', icon: 'coffee-outline' },
  { id: 'cup-500', ml: 500, label: 'bottle', icon: 'bottle-tonic-outline' },
];

export const DEFAULT_CUP_ID = 'cup-250';

export const defaultPrefs: Prefs = { preferredCupId: DEFAULT_CUP_ID, largeText: false, haptics: true };

/** A new plant starts the day before `today`, so today is the first day that gets evaluated later. */
export const defaultProgress = (yesterday: DayKey): PlantProgress => ({
  goalDays: 0,
  stage: 0,
  streak: 0,
  bestStreak: 0,
  streakFreezes: 0,
  lastEvaluatedDay: yesterday,
  activeSkin: 'classic',
  activeCupTheme: 'classic',
  unlocked: ['classic'],
});

export const defaultMeta = (now = Date.now()): AppMeta => ({ installAt: now, launches: 0, reviewPrompted: 0, sessionsSinceInterstitial: 0 });
