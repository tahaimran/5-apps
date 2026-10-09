import { initAds } from '@shared/ads';
import { adPolicy, adUnits } from '@/ads.config';
import { useMeta } from '@/store/meta';

let started: Promise<void> | null = null;

/**
 * Runs consent (UMP) and then starts the ads SDK, once (plan §6: consent comes after the disclaimer, never before it and never in the
 * middle of a session). Until the "I understand" disclaimer has been acknowledged this does nothing at all, so no consent form and no
 * ad request can precede it. Never throws; ads are optional.
 */
export function startAds(): Promise<void> {
  if (useMeta.getState().meta.disclaimerAckAt === undefined) return Promise.resolve();
  started ??= initAds(adPolicy, adUnits).catch(() => undefined);
  return started;
}

/** Tests only. */
export const resetAdsStart = () => {
  started = null;
};
