import { isRewardedReady, showRewarded } from '@shared/ads';
import type { RewardedPlacement } from '@/domain/adRules';

export type RewardedOutcome = 'granted' | 'unavailable' | 'busy' | 'closed';

let watching = false;

/** True while a rewarded video is on screen (the quiz must not treat the app going to the background as a pause then). */
export const isWatchingAd = (): boolean => watching;

/**
 * Plays an opt-in rewarded video (plan §12). The reward is granted only when the SDK reports that it
 * was earned. If no ad is loaded the answer is `unavailable` at once (the button says "Not available
 * right now"): we never wait on a spinner and never grant anything silently. A second tap while one is
 * playing is ignored, so a fast double tap cannot grant twice.
 */
export async function watchRewarded(placement: RewardedPlacement): Promise<RewardedOutcome> {
  if (watching) return 'busy';
  if (!isRewardedReady(placement)) return 'unavailable';
  watching = true;
  try {
    const { rewarded } = await showRewarded(placement);
    return rewarded ? 'granted' : 'closed';
  } catch {
    return 'unavailable';
  } finally {
    watching = false;
  }
}

/** Tests only. */
export const resetRewardedForTests = () => {
  watching = false;
};
