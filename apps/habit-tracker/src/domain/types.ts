export type HabitId = string; // nanoid(10)
export type DayKey = `${number}-${number}-${number}`; // YYYY-MM-DD, local
export type HabitType = 'boolean' | 'count' | 'timer';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type CategoryId = string;
export type GoalId = string;

export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: Weekday[] }
  | { kind: 'perWeek'; times: 1 | 2 | 3 | 4 | 5 | 6 };

export interface Habit {
  id: HabitId;
  name: string;
  icon: string;
  color: string; // hex from the habit palette
  type: HabitType;
  target: number; // boolean → 1; timer → minutes
  unit?: string;
  schedule: Schedule;
  category: CategoryId;
  reminders: { time: string /* HH:mm */; notifIds: string[] }[];
  templateId?: string;
  createdAt: DayKey;
  archivedAt?: string;
  stats?: { best: number; bestComputedAt: string }; // cache
}

export interface Entry {
  value: number;
  frozen?: boolean;
  timerStartedAt?: number;
  updatedAt: number;
}

export interface DayNote {
  text: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  updatedAt: number;
}

export interface FreezeState {
  count: number;
  lastAdEarnDay?: DayKey;
  lastPerfectWeek?: DayKey;
  log: { day: DayKey; source: 'ad' | 'perfectWeek' | 'used' }[];
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  premiumTheme?: { id: string; unlockedUntil: number };
  weekStartsOn: 0 | 1;
  dayEndsAtHour: 0 | 1 | 2 | 3 | 4;
  haptics: boolean;
  dailySummary: { enabled: boolean; time: string };
  eveningNudge: { enabled: boolean; time: string };
}

export interface Profile {
  goals: GoalId[];
  onboardingDone: boolean;
  firstOpenAt: number;
  openDays: DayKey[]; // capped at 60
  notifPermission: 'unknown' | 'granted' | 'denied';
  notifReasked: boolean;
  review: { prompted: boolean; promptedAt?: number };
}

export interface WidgetItem {
  id: HabitId;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  value: number;
  target: number;
  done: boolean;
  streak: number;
}

export interface WidgetSnapshot {
  day: DayKey;
  theme: 'light' | 'dark';
  items: WidgetItem[];
  doneCount: number;
  total: number;
  generatedAt: number;
}

export interface BackupFile {
  app: 'habit-tracker';
  schemaVersion: number;
  exportedAt: string;
  habits: Habit[];
  habitOrder: HabitId[];
  entries: Record<HabitId, Record<DayKey, Entry>>;
  notes: Record<DayKey, DayNote>;
  freezes: FreezeState;
  settings: Settings;
}
