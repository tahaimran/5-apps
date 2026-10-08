/** Data model from DEVELOPMENT_PLAN.md §9. */

export type Unit = 'ml' | 'floz';
/** 'YYYY-MM-DD' of the logical day (see dayKey.ts). */
export type DayKey = string;
/** Minutes from 00:00, 0..1439 (a derived slot may run past 1440 for overnight schedules). */
export type MinuteOfDay = number;

export type Sex = 'female' | 'male' | 'unspecified';
export type Activity = 'sedentary' | 'light' | 'active' | 'very_active';
export type Climate = 'cool' | 'mild' | 'warm' | 'hot';
/** Pregnancy, breastfeeding, senior and fasting modes arrive in v1.1; only 'standard' is exposed in the MVP. */
export type Mode = 'standard' | 'pregnancy' | 'breastfeeding' | 'senior' | 'fasting';

export interface Profile {
  sex?: Sex;
  weightKg: number;
  weightUnit: 'kg' | 'lb';
  activity: Activity;
  climate: Climate;
  mode: Mode;
}

export interface GoalSettings {
  goalMl: number;
  source: 'calculated' | 'manual';
  unit: Unit;
  updatedAt: number;
}

export interface QuietBlock {
  startMin: MinuteOfDay;
  endMin: MinuteOfDay;
}

export interface ReminderSettings {
  enabled: boolean;
  wakeMin: MinuteOfDay;
  bedMin: MinuteOfDay;
  frequency: 'smart' | 'interval';
  intervalMin: 60 | 90 | 120 | 180;
  style: 'gentle' | 'normal';
  snoozeMin: 10 | 15 | 30;
  skipWindowMin: number;
  quietBlocks: QuietBlock[];
  /** 0 = Sunday .. 6 = Saturday. */
  activeWeekdays: number[];
}

export interface Cup {
  id: string;
  ml: number;
  /** i18n key under `cups.*` for the built-in cups, free text for user-made ones. */
  label: string;
  icon: string;
}

export type BeverageId = 'water' | 'sparkling' | 'tea' | 'coffee' | 'juice' | 'milk' | 'soda';

export interface BeverageFactor {
  id: BeverageId;
  factor: number;
}

export type LogSource = 'app' | 'notification' | 'widget';

export interface LogEntry {
  id: string;
  ts: number;
  dayKey: DayKey;
  beverage: BeverageId;
  volumeMl: number;
  effectiveMl: number;
  source: LogSource;
}

export interface DaySummary {
  dayKey: DayKey;
  effectiveMl: number;
  goalMl: number;
  count: number;
  reached: boolean;
}

export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface PlantProgress {
  /** Days the goal was reached and evaluated (never decreases). Drives the plant stage. */
  goalDays: number;
  stage: PlantStage;
  streak: number;
  bestStreak: number;
  streakFreezes: number;
  /** Last logical day that has been closed out. */
  lastEvaluatedDay: DayKey;
  activeSkin: string;
  activeCupTheme: string;
  unlocked: string[];
}

export interface ScheduledReminder {
  notificationId: string;
  fireAt: number;
  kind: 'slot' | 'snooze';
}

export interface AppMeta {
  installAt: number;
  launches: number;
  lastReviewPromptAt?: number;
  reviewPrompted: number;
  lastInterstitialAt?: number;
  lastAppOpenAdAt?: number;
  sessionsSinceInterstitial: number;
  /** Reminders the OS dropped without firing (plan §10.5); two of them offer the battery guide. */
  suspectedMisses?: number;
  batteryGuideOffered?: boolean;
}

/**
 * Small preferences that the plan's key list does not name (stored under `prefs`).
 * `preferredCupId` is the cup behind the "+250 ml" notification button.
 */
export interface Prefs {
  preferredCupId: string;
  largeText: boolean;
  haptics: boolean;
  /** Last day the goal-reached confetti played (once per day). */
  celebratedDay?: DayKey;
  /** Last day a streak freeze was earned from a rewarded ad (max one per day). */
  freezeEarnedDay?: DayKey;
  /** Rewarded skin/theme unlocks today, for the 10/day cap. */
  unlocksToday?: { day: DayKey; count: number };
  /** Full-screen ads shown today, for the 4/day cap. */
  fullScreenToday?: { day: DayKey; count: number };
}

export interface BackupFile {
  app: 'water-reminder';
  schemaVersion: number;
  exportedAt: string;
  profile: Profile;
  goal: GoalSettings;
  reminders: ReminderSettings;
  cups: Cup[];
  beverages: BeverageFactor[];
  prefs: Prefs;
  /** Logs by month shard, e.g. '2026-10'. */
  logs: Record<string, LogEntry[]>;
  daySummaries: Record<DayKey, DaySummary>;
  progress: PlantProgress;
}
