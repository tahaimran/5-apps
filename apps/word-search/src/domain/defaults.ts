import type { AdCounters, DailyState, HintWallet, PackProgress, Settings, Stats } from './types';

export const FREE_HINTS_PER_DAY = 3;

export const defaultSettings: Settings = {
  textSize: 'large',
  difficulty: 'easy',
  selectionMode: 'both',
  haptics: true,
  showTimer: false,
};

export const defaultPackProgress = (): PackProgress => ({
  easy: { currentLevel: 1, stars: {} },
  medium: { currentLevel: 1, stars: {} },
  hard: { currentLevel: 1, stars: {} },
});

export const defaultDaily = (): DailyState => ({ completed: {}, streak: 0, bestStreak: 0, freezes: 0 });

export const defaultHints = (dateKey: string): HintWallet => ({ free: FREE_HINTS_PER_DAY, bonus: 0, resetDateKey: dateKey });

export const defaultStats = (now: number = Date.now()): Stats => ({
  puzzlesCompleted: 0,
  wordsFound: 0,
  sessions: 0,
  firstOpenAt: now,
  foundWords: {},
});

export const defaultAdCounters = (): AdCounters => ({
  levelsSinceInterstitial: 0,
  lastInterstitialAt: 0,
  lastAppOpenAt: 0,
  interstitialTimes: [],
});
