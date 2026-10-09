import { createStore } from '@shared/storage';
import type {
  AdState,
  CachedPdf,
  Checklist,
  ChecklistId,
  ContractionSession,
  ID,
  KickSession,
  Meta,
  Profile,
  Settings,
  ThemePref,
  Unlocks,
} from '@/domain/types';
import { migrations, SCHEMA_VERSION } from './migrations';

/** An answer kept by the onboarding flow so a kill in the middle resumes at the same screen. */
export interface OnboardingResume {
  index: number;
  answers: Record<string, unknown>;
}

/**
 * Plan §9 keys, without the `ct.` prefix (the MMKV store id already is `ct`). The theme mode is owned by
 * @shared/theme (`theme.mode`) and the onboarding flag by @shared/onboarding.
 */
export interface CtKeys {
  schemaVersion: number;
  profile: Profile;
  settings: Settings;
  /** Written synchronously on every tap: the source of truth for a running timer. */
  activeSession: ContractionSession | null;
  'sessions.index': ID[];
  [archived: `session.${string}`]: ContractionSession;
  activeKick: KickSession | null;
  kicks: KickSession[];
  checklists: Partial<Record<ChecklistId, Checklist>>;
  unlocks: Unlocks;
  adState: AdState;
  meta: Meta;
  'onboarding.resume': OnboardingResume;
  /** What the theme was before Night was switched on, so the header button can switch back. */
  themeBeforeNight: ThemePref;
  /** PDFs made for sharing, deleted from the cache after 24 hours. */
  pdfCache: CachedPdf[];
  /** Identifier of the last notification tap that was acted on, so one tap is handled once. */
  handledResponse: string;
}

/** The app's MMKV store (id `ct`). Opening it runs pending migrations synchronously. */
export const db = createStore<CtKeys>('ct', SCHEMA_VERSION, migrations);

db.set('schemaVersion', SCHEMA_VERSION);
