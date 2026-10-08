import { adShownThisSession } from '@shared/ads';
import { maybeAskForReview } from '@shared/review';
import { useProfile } from '@/store/profile';

/** Plan §13: first at a 3-day streak, a second try at 14 days if the first was over 30 days ago. */
export const REVIEW_MILESTONES: readonly number[] = [3, 14];
/** Confetti runs about 1.7 s; the prompt follows once it has finished. */
export const REVIEW_DELAY_MS = 3700;

export interface ReviewDeps {
  adShown: () => boolean;
  ask: (trigger: string, rules: { minPositiveEvents: number; minDaysSinceInstall: number; minDaysBetweenAsks: number }) => Promise<boolean>;
  onAsked: () => void;
}

const defaultDeps: ReviewDeps = {
  adShown: adShownThisSession,
  ask: maybeAskForReview,
  onAsked: () => useProfile.getState().update({ review: { prompted: true, promptedAt: Date.now() } }),
};

/**
 * Asks for an in-app review shortly after a celebrated streak milestone, unless an ad has been
 * shown this session. No "do you like us?" pre-prompt (Play policy). Returns a cancel function.
 */
export function scheduleReviewAfterMilestone(milestone: number, deps: ReviewDeps = defaultDeps): () => void {
  if (!REVIEW_MILESTONES.includes(milestone)) return () => undefined;
  const timer = setTimeout(async () => {
    if (deps.adShown()) return;
    const asked = await deps.ask(`streak-${milestone}`, { minPositiveEvents: 1, minDaysSinceInstall: 0, minDaysBetweenAsks: 30 });
    if (asked) deps.onAsked();
  }, REVIEW_DELAY_MS);
  return () => clearTimeout(timer);
}
