export type Difficulty = 'easy' | 'medium' | 'hard';
export type TextSize = 'comfortable' | 'large' | 'xlarge' | 'huge';
export type PackId = string;
export type Direction = 'E' | 'S' | 'SE' | 'NE' | 'W' | 'N' | 'NW' | 'SW';
export type SelectionMode = 'both' | 'tapOnly';
/** `YYYY-MM-DD` in device local time. */
export type DateKey = string;

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

/** The pre-prompt's memory (plan §10): asked at most twice, the second time 7 days after the first. */
export interface ReminderPrompt {
  askCount: number;
  askedAt: number;
  /** Real puzzles finished since install (the tutorial does not count). */
  completions: number;
}

/** In-app review gating (plan §9 `ws.review`). */
export interface ReviewState {
  lastPromptAt?: number;
  promptCount: number;
  positiveMoments: number;
}

export interface Settings {
  textSize: TextSize;
  difficulty: Difficulty;
  selectionMode: SelectionMode;
  haptics: boolean;
  showTimer: boolean;
  sounds: boolean;
  reminder: ReminderSettings;
}

export interface PlacedWord {
  word: string;
  row: number;
  col: number;
  dir: Direction;
  found: boolean;
  colorIdx?: number;
}

export interface Puzzle {
  /** `${packId}:${difficulty}:${level}`, `daily:${dateKey}:${difficulty}` or `tutorial`. */
  id: string;
  seed: number;
  size: number;
  /** Rows as strings of A–Z. */
  grid: string[];
  words: PlacedWord[];
  packId: PackId;
  difficulty: Difficulty;
}

/** A hint on screen: the first letter of a word, and its last letter on a second hint. */
export interface HintedWord {
  word: string;
  /** 1 = first letter, 2 = first and last letter. */
  level: 1 | 2;
}

export interface SavedGame {
  puzzle: Puzzle;
  hintsUsed: number;
  startedAt: number;
  elapsedMs: number;
  /** Cells revealed by hints, as [row, col]. */
  hintedCells: [number, number][];
  hintedWords: HintedWord[];
}

export type Stars = 1 | 2 | 3;

export interface LevelTrack {
  currentLevel: number;
  stars: Record<number, Stars>;
}
export type PackProgress = Record<Difficulty, LevelTrack>;

export interface DailyState {
  completed: Record<DateKey, { stars: Stars; at: number }>;
  streak: number;
  bestStreak: number;
  lastDailyDateKey?: DateKey;
  freezes: number;
}

export interface HintWallet {
  free: number;
  bonus: number;
  resetDateKey: DateKey;
  courtesyUsedDateKey?: DateKey;
}

export interface Stats {
  puzzlesCompleted: number;
  wordsFound: number;
  sessions: number;
  firstOpenAt: number;
  foundWords: Record<string, number>;
}

/** Counters behind the app-level ad rules (plan §9 `ws.ads`). */
export interface AdCounters {
  levelsSinceInterstitial: number;
  lastInterstitialAt: number;
  lastAppOpenAt: number;
  /** Start times (ms) of interstitials shown in the last hour, for the 6-an-hour cap. */
  interstitialTimes: number[];
}

export interface OnboardingResume {
  index: number;
  answers: Record<string, unknown>;
}

/** What the Complete screen shows for the puzzle that was just finished. */
export interface CompletedResult {
  puzzleId: string;
  packId: PackId;
  difficulty: Difficulty;
  level?: number;
  dateKey?: DateKey;
  isDaily: boolean;
  isTutorial: boolean;
  stars: Stars;
  wordsFound: number;
  elapsedMs: number;
  hintsUsed: number;
  /** The streak after a daily completion that counted for it. */
  streak?: number;
  streakCounted?: boolean;
}
