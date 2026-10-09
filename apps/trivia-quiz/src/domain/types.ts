/** Types from DEVELOPMENT_PLAN.md §9, plus the few extra fields the build needed (marked "extra"). */
export type CategoryId =
  | 'general'
  | 'geography'
  | 'history'
  | 'science'
  | 'movies'
  | 'music'
  | 'sports'
  | 'animals'
  | 'food'
  | 'literature'
  | 'logic'
  | 'flags';

/** 1 easy, 2 medium, 3 hard. */
export type Difficulty = 1 | 2 | 3;
export type QuestionId = string;
/** `YYYY-MM-DD` in device local time. */
export type DateKey = string;
export type TextScale = 0.9 | 1 | 1.15 | 1.3;
export type ThemeChoice = 'system' | 'light' | 'dark';

export interface Question {
  id: QuestionId;
  q: string;
  /** a[0] is ALWAYS the correct answer; shuffled when shown. */
  a: [string, string, string, string];
  d: Difficulty;
  x: string;
  src?: string;
  tags?: string[];
  img?: string;
  ev?: 1;
  rev: number;
}

export interface QuestionFile {
  category: CategoryId;
  locale: string;
  version: string;
  questions: Question[];
}

/** A question as shown: the options in display order and where the right one landed. */
export interface Presented {
  question: Question;
  options: string[];
  correctIndex: number;
}

export interface Profile {
  xp: number;
  level: number;
  favoriteCategories: CategoryId[];
  preferredDifficulty: Difficulty;
  createdAt: number;
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

/** The plan's Settings minus `music` (no music is bundled, so there is nothing to switch). */
export interface Settings {
  sound: boolean;
  haptics: boolean;
  textScale: TextScale;
  theme: ThemeChoice;
  relaxedMode: boolean;
  reminder: ReminderSettings;
}

export type Stars = 0 | 1 | 2 | 3;

export interface ClassicProgress {
  stars: Record<number, Stars>;
  /** Highest unlocked level (1-based). */
  unlocked: number;
  bestScores: Record<number, number>;
}

export interface SeenEntry {
  /** epochDay of the last time it was shown */
  d: number;
  /** times seen */
  n: number;
  /** times answered correctly */
  c: number;
}

export interface DailyHistoryEntry {
  date: DateKey;
  score: number;
}

export interface DailyState {
  lastPlayedDate: DateKey | null;
  lastScore: number;
  /** Last 30 results, oldest first. */
  history: DailyHistoryEntry[];
}

export interface StreakState {
  current: number;
  best: number;
  freezes: number;
  lastDate: DateKey | null;
  /**
   * The `lastDate` of the break that a rewarded "Restore streak" already covered, so one break can be
   * restored once. (The plan names the field but not its meaning.)
   */
  restoredAt?: DateKey;
  /** extra: when the last streak day was counted (ms) and the UTC offset then, for the time-zone guard. */
  countedAtMs?: number;
  countedOffsetMin?: number;
}

export interface Stats {
  answered: number;
  correct: number;
  byCategory: Record<string, { a: number; c: number }>;
  blitzBest: number;
  /** extra: best Blitz score per local date, last 30 days (plan F4: "personal best stored per day/all-time"). */
  blitzBestByDate: Record<DateKey, number>;
  roundsPlayed: number;
  doubleXpToday: { date: DateKey; count: number };
  /** extra: lifetime counters behind the ad and review rules. */
  sessions: number;
  firstOpenAt: number;
  /** extra: rounds with 8+ correct and 3-star finishes (kept for the stats screen). */
  perfectRounds: number;
}

/** Counters behind the app-level ad rules (plan §9 `tq.ads`; the cap state shared with @shared/ads is separate). */
export interface AdCounters {
  roundsSinceInterstitial: number;
  lastInterstitialAt: number;
  lastAppOpenAt: number;
  interstitialDay: { date: DateKey; count: number };
  rewardedDay: { date: DateKey; count: number };
}

export interface OnboardingResume {
  index: number;
  answers: Record<string, unknown>;
}

export interface ReviewState {
  lastPromptAt?: number;
  promptCount: number;
}

export type RoundMode = 'classic' | 'category' | 'blitz' | 'daily' | 'warmup';
