import * as StoreReview from 'expo-store-review';
import { sharedStore } from '../storage';

const MIN_POSITIVE_EVENTS = 3;
const MIN_DAYS_SINCE_INSTALL = 2;
const MIN_DAYS_BETWEEN_ASKS = 60;
const DAY_MS = 86_400_000;

export interface ReviewRules {
  /** Default 3. */
  minPositiveEvents?: number;
  /** Default 2. */
  minDaysSinceInstall?: number;
  /** Default 60. */
  minDaysBetweenAsks?: number;
}

/**
 * Call at moments of success (streak hit, level won, goal reached). Each call counts as one
 * positive event; the in-app review prompt is requested only when there have been at least 3
 * positive events, the app is at least 2 days old, and it was not asked in the last 60 days
 * (override with `rules`).
 * Returns true if the prompt was requested. `trigger` is for readability at call sites.
 */
export async function maybeAskForReview(trigger: string, rules: ReviewRules = {}): Promise<boolean> {
  void trigger;
  const minEvents = rules.minPositiveEvents ?? MIN_POSITIVE_EVENTS;
  const minInstallDays = rules.minDaysSinceInstall ?? MIN_DAYS_SINCE_INSTALL;
  const minAskGapDays = rules.minDaysBetweenAsks ?? MIN_DAYS_BETWEEN_ASKS;
  const events = (sharedStore.get('review.positiveEvents') ?? 0) + 1;
  sharedStore.set('review.positiveEvents', events);

  const now = Date.now();
  const installedAt = sharedStore.get('install.firstOpenAt') ?? now;
  const lastAskedAt = sharedStore.get('review.lastAskedAt');

  if (events < minEvents) return false;
  if (now - installedAt < minInstallDays * DAY_MS) return false;
  if (lastAskedAt !== undefined && now - lastAskedAt < minAskGapDays * DAY_MS) return false;
  if (!(await StoreReview.isAvailableAsync())) return false;

  sharedStore.set('review.lastAskedAt', now);
  sharedStore.set('review.positiveEvents', 0);
  await StoreReview.requestReview();
  return true;
}
