import { createStore } from '@shared/storage';
import type { CelebratedState } from '@/domain/celebrations';
import type { DayNote, DayKey, Entry, FreezeState, Habit, HabitId, Profile, Settings, WidgetSnapshot } from '@/domain/types';
import { migrations, SCHEMA_VERSION } from './migrations';

export interface HabitKeys {
  schemaVersion: number;
  habits: Record<HabitId, Habit>;
  habitOrder: HabitId[];
  notes: Record<DayKey, DayNote>;
  freezes: FreezeState;
  settings: Settings;
  profile: Profile;
  'widget:snapshot': WidgetSnapshot;
  celebrated: CelebratedState;
  /** When the app was last opened (ms). */
  lastOpenAt: number;
  /** Sharded per habit to keep writes small. */
  [key: `entries:${string}`]: Record<DayKey, Entry>;
}

/** The app's MMKV store (id `habit-tracker`). Opening it runs pending migrations synchronously. */
export const db = createStore<HabitKeys>('habit-tracker', SCHEMA_VERSION, migrations);

db.set('schemaVersion', SCHEMA_VERSION);
