import { showRewarded } from '@shared/ads';
import { rewardedDecision } from './guard';

export type WatchResult = 'earned' | 'closed' | 'blocked';

/**
 * A rewarded video the person asked for (plan §12: "User-initiated only"). `@shared/ads` does not run the app veto for
 * rewarded ads, so it is checked here first: while a contraction session or a kick count is open the answer is
 * `blocked` and no ad is requested. `earned` only when the video was watched to the end; `closed` covers an early close, no fill,
 * no consent and any failure (the caller says "try again later").
 */
export async function watchRewarded(placement: string): Promise<WatchResult> {
  if (!rewardedDecision(placement).allowed) return 'blocked';
  try {
    const { rewarded } = await showRewarded(placement);
    return rewarded ? 'earned' : 'closed';
  } catch {
    return 'closed';
  }
}
