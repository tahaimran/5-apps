import type { ReviewState } from './types';

export const REVIEW_MIN_SESSIONS = 3;
export const REVIEW_MIN_PUZZLES = 5;
export const REVIEW_GAP_MS = 30 * 86_400_000;
export const REVIEW_MAX_PROMPTS = 3;
export const REVIEW_AD_QUIET_MS = 60_000;
export const STREAK_MILESTONES = [7, 30, 100];

export interface ReviewContext {
  review: ReviewState;
  sessions: number;
  puzzlesCompleted: number;
  stars: 1 | 2 | 3;
  /** The streak after a daily puzzle that counted, if this was one. */
  streak?: number;
  streakCounted?: boolean;
  now: number;
  /** When the last full-screen ad closed (ms), 0 = never. */
  lastFullScreenAt: number;
  tutorial: boolean;
}

/** A moment worth a smile: a 3-star finish or a streak milestone (plan §12). */
export const isPositiveMoment = (c: Pick<ReviewContext, 'stars' | 'streak' | 'streakCounted' | 'tutorial'>): boolean =>
  !c.tutorial && (c.stars === 3 || (c.streakCounted === true && c.streak !== undefined && STREAK_MILESTONES.includes(c.streak)));

/**
 * Plan §12: at least 3 sessions, 5 puzzles, a positive moment, no ad in the last 60 s, 30 days since the
 * last prompt, fewer than 3 prompts in all. There is no "Do you like the app?" step first.
 */
export function reviewEligible(c: ReviewContext): boolean {
  if (!isPositiveMoment(c)) return false;
  if (c.sessions < REVIEW_MIN_SESSIONS || c.puzzlesCompleted < REVIEW_MIN_PUZZLES) return false;
  if (c.review.promptCount >= REVIEW_MAX_PROMPTS) return false;
  if (c.review.lastPromptAt !== undefined && c.now - c.review.lastPromptAt < REVIEW_GAP_MS) return false;
  if (c.lastFullScreenAt > 0 && c.now - c.lastFullScreenAt < REVIEW_AD_QUIET_MS) return false;
  return true;
}
