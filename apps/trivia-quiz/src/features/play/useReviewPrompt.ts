import { useEffect, useRef } from 'react';
import { maybeAskForReview } from '@shared/review';
import { reviewEligible } from '@/domain/reviewRules';
import { useAds } from '@/store/ads';
import { useResult } from '@/store/result';
import { useReview, useStats } from '@/store/stores';
import type { RoundResult } from './commit';

/** A beat after the celebration before the system prompt appears, so the stars are seen first. */
export const REVIEW_DELAY_MS = 800;

/**
 * Asks for a store review at a positive moment (plan §13). The rules are the pure `reviewEligible`; the
 * shared call only does the system prompt and its own bookkeeping (so it is told to allow it). Returns a
 * ref that is true once the prompt was shown, so the caller can skip an interstitial this time.
 */
export function useReviewPrompt(result: RoundResult | null) {
  const asked = useRef(false);
  const id = result?.id;
  useEffect(() => {
    const r = useResult.getState().last;
    if (!r || r.id !== id) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      const stats = useStats.getState().value;
      const eligible = reviewEligible({
        review: useReview.getState().value,
        now,
        firstOpenAt: stats.firstOpenAt,
        roundsPlayed: stats.roundsPlayed,
        mode: r.mode,
        correct: r.correct,
        total: r.total,
        stars: r.stars,
        failedByHearts: r.failedByHearts,
        streak: r.streak,
        streakCounted: r.streakCounted,
        lastFullScreenAt: useAds.getState().lastFullScreenAt,
      });
      if (!eligible) return;
      void maybeAskForReview('round_end', { minPositiveEvents: 1, minDaysSinceInstall: 0, minDaysBetweenAsks: 60 })
        .then((shown) => {
          if (!shown) return;
          asked.current = true;
          const review = useReview.getState();
          review.set({ lastPromptAt: now, promptCount: review.value.promptCount + 1 });
        })
        .catch(() => undefined);
    }, REVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [id]);
  return asked;
}
