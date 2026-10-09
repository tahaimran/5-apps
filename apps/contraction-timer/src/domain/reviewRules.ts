import { DAY, HOUR } from './defaults';
import type { Meta } from './types';

export const REVIEW_MIN_POSITIVE_MOMENTS = 2;
export const REVIEW_MIN_APP_AGE_DAYS = 3;
export const REVIEW_GAP_DAYS = 90;
export const REVIEW_MAX_PROMPTS = 2;
export const REVIEW_QUIET_AFTER_SESSION_MS = 24 * HOUR;

export interface ReviewContext {
  meta: Meta;
  now: number;
  /** A contraction session is open (running or resting). */
  sessionOpen: boolean;
  /** A kick count is open. */
  kickOpen: boolean;
  /** The count that was just saved reached the 2-hour provider message before it finished (or this is not a kick moment). */
  hitSoftLimit: boolean;
}

/**
 * ASO.md §7: ask for a rating only after a good moment (a kick count finished at its target, or a checklist at 100%), and
 * only when: at least 2 such moments, the app is at least 3 days old, at most 2 asks ever and 90 days apart, no contraction
 * session is open or ended in the last 24 hours, and the count that just finished did not run into the 2-hour message.
 * There is no "do you like the app?" question first: Google's review rules do not allow steering only happy people to the dialog.
 */
export function reviewEligible(c: ReviewContext): boolean {
  const { meta, now } = c;
  if (meta.positiveMoments < REVIEW_MIN_POSITIVE_MOMENTS) return false;
  if (now - meta.installAt < REVIEW_MIN_APP_AGE_DAYS * DAY) return false;
  if (meta.ratingPromptCount >= REVIEW_MAX_PROMPTS) return false;
  if (meta.ratingPromptedAt !== undefined && now - meta.ratingPromptedAt < REVIEW_GAP_DAYS * DAY) return false;
  if (c.sessionOpen || c.kickOpen) return false;
  if (meta.lastSessionEndedAt !== undefined && now - meta.lastSessionEndedAt < REVIEW_QUIET_AFTER_SESSION_MS) return false;
  if (c.hitSoftLimit) return false;
  return true;
}
