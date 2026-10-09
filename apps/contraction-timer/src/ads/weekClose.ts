import { showInterstitial } from '@shared/ads';
import { useAds } from '@/store/ads';

/**
 * Plan §12 `week_close_interstitial`: the only interstitial in the app, offered when a week article is closed after a read.
 * The rules (20 seconds of reading, 3 minutes since any full-screen ad, 4 a day, none on the first day, none in Partner mode or
 * within 2 minutes of a session, never while a session or kick count is open) are in `domain/adRules.ts` and are checked by the
 * guard inside `showInterstitial`. Returns whether an ad was shown.
 */
export async function offerWeekCloseInterstitial(readMs: number, now: number = Date.now()): Promise<boolean> {
  useAds.getState().recordArticleClose(readMs, now);
  try {
    return await showInterstitial('week_close_interstitial');
  } catch {
    return false;
  }
}
