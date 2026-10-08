import { createStore } from '@shared/storage';
import type {
  AppMeta,
  BeverageFactor,
  Cup,
  DayKey,
  DaySummary,
  GoalSettings,
  LogEntry,
  PlantProgress,
  Prefs,
  Profile,
  ReminderSettings,
  ScheduledReminder,
} from '@/domain/types';
import { migrations, SCHEMA_VERSION } from './migrations';

/** Plan §9 keys, without the `water.` prefix (the MMKV store id already is `water`). */
export interface WaterKeys {
  schemaVersion: number;
  profile: Profile;
  goal: GoalSettings;
  reminders: ReminderSettings;
  cups: Cup[];
  beverages: BeverageFactor[];
  prefs: Prefs;
  daySummaries: Record<DayKey, DaySummary>;
  progress: PlantProgress;
  scheduled: ScheduledReminder[];
  meta: AppMeta;
  /** Where an interrupted onboarding resumes: the visible-step index and the answers so far. */
  'onboarding:resume': { index: number; answers: Record<string, unknown> };
  /** `<id>:<action>:<date>` of the last notification action that was carried out. */
  handledResponse: string;
  /** Last time the app was in the foreground (ms). */
  lastOpenAt: number;
  /** Month-sharded drink logs, `logs:YYYY-MM`, to keep reads and writes small. */
  [key: `logs:${string}`]: LogEntry[];
}

/** The app's MMKV store (id `water`). Opening it runs pending migrations synchronously. */
export const db = createStore<WaterKeys>('water', SCHEMA_VERSION, migrations);

db.set('schemaVersion', SCHEMA_VERSION);
