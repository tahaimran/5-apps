/** Data model of DEVELOPMENT_PLAN.md §9. All times are epoch milliseconds; dates are local `YYYY-MM-DD`. */
export type ID = string;
export type DateKey = string;
export type Intensity = 'mild' | 'moderate' | 'strong';

export interface Contraction {
  id: ID;
  startedAt: number;
  /** null while the contraction is still being timed. */
  endedAt: number | null;
  intensity?: Intensity;
  note?: string;
  /**
   * Left out of every average and of the pattern check. `undefined` means "decide by the 10 s rule"
   * (a very short one is a likely mis-tap); `true` is a choice to ignore it, `false` a choice to keep a short one.
   */
  ignored?: boolean;
}

export type RulePreset = '511' | '411' | '311' | 'custom';

export interface PatternRule {
  preset: RulePreset;
  /** The longest average gap between starts, in minutes (the first number of 5-1-1). */
  intervalMaxMin: number;
  /** The shortest average length, in seconds (the "1" minute of 5-1-1). */
  durationMinSec: number;
  /** How long it must hold, in minutes (the last "1" hour of 5-1-1). */
  sustainMin: number;
}

/** Where the "matches your pattern" banner is in its once-per-episode cycle. */
export interface PatternState {
  /** Start of the match episode that is being shown, undefined when none is open. */
  episodeStartedAt?: number;
  /** The last time the pattern was seen to match. */
  lastMatchAt?: number;
  dismissed?: boolean;
}

export interface ContractionSession {
  id: ID;
  startedAt: number;
  endedAt: number | null;
  contractions: Contraction[];
  ruleAtStart: PatternRule;
  /** The first time the pattern matched in this session (the summary says "matched at …"). */
  patternMatchedAt?: number;
  pattern?: PatternState;
  lastActivityAt: number;
  /** "Keep" was chosen on the idle prompt at this time. */
  snoozedAt?: number;
}

export interface KickSession {
  id: ID;
  startedAt: number;
  endedAt: number | null;
  /** One timestamp per counted movement. */
  taps: number[];
  target: number;
  targetReachedAt?: number;
}

export type DateMode = 'edd' | 'lmp' | 'conception' | 'ivf';
export type FirstBaby = 'yes' | 'no' | 'partner';
export type Need = 'timer' | 'kicks' | 'tracking';

export interface Profile {
  dateMode?: DateMode;
  /** The date the person entered, `YYYY-MM-DD`. */
  inputDate?: DateKey;
  cycleLength?: number;
  ivfEmbryoDay?: 3 | 5;
  /** The estimated due date worked out from the above. */
  edd?: DateKey;
  firstBaby?: FirstBaby;
  needs: Need[];
}

/** The theme choice. @shared/theme stores it (as `theme.mode`, with night kept in its `high-contrast` slot), so Settings has no theme field. */
export type ThemePref = 'system' | 'light' | 'dark' | 'night';

export interface Settings {
  rule: PatternRule;
  patternAlerts: boolean;
  partnerMode: boolean;
  haptics: boolean;
  clock24h: boolean;
  kickTarget: number;
  kickReminder: { enabled: boolean; hour: number; minute: number };
  weeklyCardNotif: boolean;
  /** v1.1; not built. Kept so the stored shape matches the plan. */
  ongoingNotif: boolean;
}

export interface ChecklistItem {
  id: ID;
  label: string;
  checked: boolean;
  group: string;
  custom?: boolean;
}

export type ChecklistId = 'hospitalBag' | 'birthPlan';

export interface Checklist {
  id: ChecklistId;
  items: ChecklistItem[];
  updatedAt: number;
}

export interface Unlocks {
  pdfThemes: string[];
  checklistTemplates: string[];
}

export interface AdState {
  lastInterstitialAt?: number;
  lastAppOpenAt?: number;
  interstitialsToday: number;
  /** The local day `interstitialsToday` counts, `YYYY-MM-DD`. */
  day: DateKey;
}

export interface Meta {
  onboardingCompletedAt?: number;
  /** The day onboarding finished, for "Kicks first on day 1 only". */
  onboardingDay?: DateKey;
  disclaimerAckAt?: number;
  ratingPromptedAt?: number;
  ratingPromptCount: number;
  positiveMoments: number;
  installAt: number;
  coachMarkShownAt?: number;
  /** When the last contraction session ended (also by the idle rule). Drives the ad and review gates. */
  lastSessionEndedAt?: number;
  lastKickEndedAt?: number;
  /** A kick session ran into the 2-hour message (no review prompt after that). */
  lastKickSoftLimitAt?: number;
  launches: number;
}

/** A PDF made for sharing; it is deleted from the cache once it is a day old. */
export interface CachedPdf {
  uri: string;
  at: number;
}
