import { CATEGORY_LIST } from './categories';
import type {
  AdCounters,
  ClassicProgress,
  DailyState,
  Profile,
  ReviewState,
  Settings,
  StreakState,
  Stats,
} from './types';

export const defaultSettings: Settings = {
  sound: true,
  haptics: true,
  textScale: 1,
  theme: 'system',
  relaxedMode: false,
  reminder: { enabled: false, hour: 19, minute: 0 },
};

export const defaultProfile = (now: number = Date.now()): Profile => ({
  xp: 0,
  level: 1,
  favoriteCategories: ['general'],
  preferredDifficulty: 2,
  createdAt: now,
});

export const defaultClassic = (): ClassicProgress => ({ stars: {}, unlocked: 1, bestScores: {} });

export const defaultDaily = (): DailyState => ({ lastPlayedDate: null, lastScore: 0, history: [] });

export const defaultStreak = (): StreakState => ({ current: 0, best: 0, freezes: 0, lastDate: null });

export const defaultStats = (now: number = Date.now()): Stats => ({
  answered: 0,
  correct: 0,
  byCategory: Object.fromEntries(CATEGORY_LIST.map((c) => [c, { a: 0, c: 0 }])),
  blitzBest: 0,
  blitzBestByDate: {},
  roundsPlayed: 0,
  doubleXpToday: { date: '', count: 0 },
  sessions: 0,
  firstOpenAt: now,
  perfectRounds: 0,
});

export const defaultAdCounters = (): AdCounters => ({
  roundsSinceInterstitial: 0,
  lastInterstitialAt: 0,
  lastAppOpenAt: 0,
  interstitialDay: { date: '', count: 0 },
  rewardedDay: { date: '', count: 0 },
});

export const defaultReview = (): ReviewState => ({ promptCount: 0 });
