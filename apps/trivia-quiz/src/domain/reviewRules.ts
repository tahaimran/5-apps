import type { ReviewState } from './types';

export const REVIEW_MIN_DAYS = 3;
export const REVIEW_MIN_ROUNDS = 5;
export const REVIEW_GAP_DAYS = 60;
export const REVIEW_AD_QUIET_MS = 60_000;
export const REVIEW_MIN_CORRECT = 8;
export const STREAK_MILESTONES = [3, 7, 30];
const DAY_MS = 86_400_000;

export interface ReviewContext {
  review: ReviewState;
  now: number;
  firstOpenAt: number;
  roundsPlayed: number;
  mode: 'classic' | 'category' | 'blitz' | 'daily' | 'warmup';
  correct: number;
  total: number;
  /** Classic stars (0 = failed). */
  stars: number;
  failedByHearts: boolean;
  /** The streak after a Daily that counted, if this was one. */
  streak?: number;
  streakCounted?: boolean;
  /** When the last full-screen ad closed (ms), 0 = never. */
  lastFullScreenAt: number;
}

/** A moment worth a smile (plan §13): 8 of 10 or better, a 3-star level, or a 3, 7 or 30 day streak. Never a failed level. */
export function isPositiveMoment(c: Pick<ReviewContext, 'mode' | 'correct' | 'total' | 'stars' | 'failedByHearts' | 'streak' | 'streakCounted'>): boolean {
  if (c.mode === 'warmup' || c.mode === 'blitz' || c.failedByHearts) return false;
  if (c.mode === 'classic' && c.stars === 0) return false;
  const strong = c.total >= 10 && c.correct >= REVIEW_MIN_CORRECT;
  const threeStars = c.mode === 'classic' && c.stars === 3;
  const milestone = c.streakCounted === true && c.streak !== undefined && STREAK_MILESTONES.includes(c.streak);
  return strong || threeStars || milestone;
}

/**
 * Plan §13: at least 3 days since install, 5 rounds played, a positive moment, no ad in the last 60 s and
 * 60 days since the last ask. There is no "Do you like the app?" step first.
 */
export function reviewEligible(c: ReviewContext): boolean {
  if (!isPositiveMoment(c)) return false;
  if (c.now - c.firstOpenAt < REVIEW_MIN_DAYS * DAY_MS) return false;
  if (c.roundsPlayed < REVIEW_MIN_ROUNDS) return false;
  if (c.review.lastPromptAt !== undefined && c.now - c.review.lastPromptAt < REVIEW_GAP_DAYS * DAY_MS) return false;
  if (c.lastFullScreenAt > 0 && c.now - c.lastFullScreenAt < REVIEW_AD_QUIET_MS) return false;
  return true;
}
