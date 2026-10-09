import { defaultAdCounters, defaultClassic, defaultDaily, defaultProfile, defaultReview, defaultStats, defaultStreak } from '@/domain/defaults';
import { persisted } from './persisted';

/** XP, level and the favourites picked in onboarding (`tq.profile`). */
export const useProfile = persisted('profile', () => defaultProfile());
/** Classic stars per category (`tq.progress.classic`). */
export const useClassic = persisted('progress.classic', () => ({}), false);
/** Which questions were shown, when, and how often right (`tq.seen`). */
export const useSeen = persisted('seen', () => ({}), false);
/** The Daily Challenge result and the last 30 days (`tq.daily`). */
export const useDaily = persisted('daily', defaultDaily);
/** The daily streak and freezes (`tq.streak`). */
export const useStreak = persisted('streak', defaultStreak);
/** Lifetime counters (`tq.stats`). */
export const useStats = persisted('stats', () => defaultStats());
/** Ad frequency state kept by the app rules (`tq.ads`). */
export const useAdCounters = persisted('ads', defaultAdCounters);
/** Review prompt memory (`tq.review`). */
export const useReview = persisted('review', defaultReview);

export { defaultClassic };
