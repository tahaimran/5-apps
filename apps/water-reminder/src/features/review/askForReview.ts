import { adShownThisSession } from '@shared/ads';
import { maybeAskForReview } from '@shared/review';
import { useMeta } from '@/store/meta';

/** Plan §13: at least 3 goal days in total, installed 3+ days ago, at most 3 prompts, 60 days apart. */
export const MIN_GOAL_DAYS = 3;
export const MAX_PROMPTS = 3;
/** Confetti runs about 1.2 s and its toast about 3.2 s; the prompt follows once they are gone. */
export const REVIEW_DELAY_MS = 4000;

export interface ReviewDeps {
  adShown: () => boolean;
  ask: (trigger: string, rules: { minPositiveEvents: number; minDaysSinceInstall: number; minDaysBetweenAsks: number }) => Promise<boolean>;
  prompted: () => number;
  onAsked: () => void;
}

const defaultDeps: ReviewDeps = {
  adShown: adShownThisSession,
  ask: maybeAskForReview,
  prompted: () => useMeta.getState().meta.reviewPrompted,
  onAsked: () => useMeta.getState().update({ reviewPrompted: useMeta.getState().meta.reviewPrompted + 1, lastReviewPromptAt: Date.now() }),
};

export interface GoalDayContext {
  /** Goal days including today. */
  goalDays: number;
  /** The log that reached the goal came from a notification. */
  fromNotification: boolean;
}

/**
 * Asks for an in-app review shortly after the goal-reached celebration, if the plan's rules allow
 * it: 3+ goal days, not after a notification log, under 3 prompts so far and no ad shown this
 * session. No pre-prompt question (Play policy discourages review gating). Returns a cancel function.
 */
export function scheduleReviewAfterGoal(ctx: GoalDayContext, deps: ReviewDeps = defaultDeps): () => void {
  if (ctx.goalDays < MIN_GOAL_DAYS || ctx.fromNotification || deps.prompted() >= MAX_PROMPTS) return () => undefined;
  const timer = setTimeout(async () => {
    if (deps.adShown()) return;
    const asked = await deps.ask('goal_reached', { minPositiveEvents: 1, minDaysSinceInstall: 3, minDaysBetweenAsks: 60 });
    if (asked) deps.onAsked();
  }, REVIEW_DELAY_MS);
  return () => clearTimeout(timer);
}
