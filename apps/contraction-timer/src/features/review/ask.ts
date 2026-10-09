import { maybeAskForReview } from '@shared/review';
import { reviewEligible } from '@/domain/reviewRules';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useSessions } from '@/store/sessions';

export type PositiveMoment = 'kickTarget' | 'checklistComplete';

/**
 * A good moment happened: count it, and ask for a rating if every rule in `reviewRules.ts` allows (ASO.md §7). The
 * system dialog is Google's own and may not show at all. Never throws. Returns whether it was requested.
 */
export async function recordPositiveMoment(kind: PositiveMoment, opts: { hitSoftLimit?: boolean; now?: number } = {}): Promise<boolean> {
  const now = opts.now ?? Date.now();
  const meta = useMeta.getState();
  meta.update({ positiveMoments: meta.meta.positiveMoments + 1 });
  const ok = reviewEligible({
    meta: useMeta.getState().meta,
    now,
    sessionOpen: useSessions.getState().active !== null,
    kickOpen: useKicks.getState().active !== null,
    hitSoftLimit: opts.hitSoftLimit ?? false,
  });
  if (!ok) return false;
  try {
    // Our rules above already decided; the shared helper's own gating is switched down to "always" so it only does the asking.
    const asked = await maybeAskForReview(kind, { minPositiveEvents: 1, minDaysSinceInstall: 0, minDaysBetweenAsks: 0 });
    if (asked) useMeta.getState().update({ ratingPromptedAt: now, ratingPromptCount: useMeta.getState().meta.ratingPromptCount + 1, positiveMoments: 0 });
    return asked;
  } catch {
    return false;
  }
}
