import { createStore } from '@shared/storage';
import type {
  AdCounters,
  DailyState,
  HintWallet,
  OnboardingResume,
  ReminderPrompt,
  ReviewState,
  PackId,
  PackProgress,
  SavedGame,
  Settings,
  Stats,
} from '@/domain/types';
import { migrations, SCHEMA_VERSION } from './migrations';

/**
 * Plan §9 keys, without the `ws.` prefix (the MMKV store id already is `ws`). The theme mode is
 * owned by @shared/theme (`theme.mode`) and the onboarding flag by @shared/onboarding.
 */
export interface WsKeys {
  schemaVersion: number;
  settings: Settings;
  'progress.packs': Record<PackId, PackProgress>;
  current: SavedGame | null;
  daily: DailyState;
  hints: HintWallet;
  stats: Stats;
  ads: AdCounters;
  reminderPrompt: ReminderPrompt;
  /** Identifier of the last notification tap that was acted on, so one tap is handled once. */
  handledResponse: string;
  review: ReviewState;
  /** Where an interrupted onboarding resumes: the visible-step index and the answers so far. */
  'onboarding.resume': OnboardingResume;
  /** The tutorial puzzle was finished, or its "Skip tutorial" link was used. */
  'onboarding.tutorialDone': boolean;
}

/** The app's MMKV store (id `ws`). Opening it runs pending migrations synchronously. */
export const db = createStore<WsKeys>('ws', SCHEMA_VERSION, migrations);

db.set('schemaVersion', SCHEMA_VERSION);
