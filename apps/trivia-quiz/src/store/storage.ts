import { createStore } from '@shared/storage';
import type {
  AdCounters,
  CategoryId,
  ClassicProgress,
  DailyState,
  OnboardingResume,
  Profile,
  ReviewState,
  SeenEntry,
  Settings,
  StreakState,
  Stats,
} from '@/domain/types';
import { migrations, SCHEMA_VERSION } from './migrations';

/** Plan §9 keys, without the `tq.` prefix (the MMKV store id already is `tq`). The onboarding flag lives in @shared/onboarding. */
export interface TqKeys {
  schemaVersion: number;
  profile: Profile;
  settings: Settings;
  'progress.classic': Partial<Record<CategoryId, ClassicProgress>>;
  seen: Record<string, SeenEntry>;
  daily: DailyState;
  streak: StreakState;
  stats: Stats;
  ads: AdCounters;
  review: ReviewState;
  'content.version': string;
  /** Where an interrupted onboarding resumes: the visible-step index and the answers so far. */
  'onboarding.resume': OnboardingResume;
  /** The whole first-run path (setup, warm-up, consent, reminder) is finished (plan §6: `onboarding.done`). */
  'onboarding.done': boolean;
  /** The warm-up was played or skipped. */
  'onboarding.warmupDone': boolean;
  /** Warm-up score for the result screen. */
  'onboarding.warmupScore': number;
  /** Home shows its coach mark once after onboarding. */
  coachDone: boolean;
  /** Reminder soft-ask memory: asked in onboarding, and whether the 3-day-streak re-ask already happened. */
  reminderAsk: { declinedAt: number; reaskedAt: number };
  /** Identifier of the last notification tap that was acted on, so one tap is handled once. */
  handledResponse: string;
  /** Local funnel counters (plan §6): onb_start, onb_done, ... */
  funnel: Record<string, number>;
}

/** The app's MMKV store (id `tq`). Opening it runs pending migrations synchronously. */
export const db = createStore<TqKeys>('tq', SCHEMA_VERSION, migrations);

db.set('schemaVersion', SCHEMA_VERSION);
