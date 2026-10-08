import { initAds } from '@shared/ads';
import { adPolicy, adUnits } from '@/ads.config';

let started: Promise<void> | null = null;

/**
 * Runs consent (UMP) and then starts the ads SDK. Called once: after the notification step of
 * onboarding (plan §6 step 10) on a first run, or at launch when onboarding is already done.
 * Never throws; ads are optional.
 */
export function startAds(): Promise<void> {
  started ??= initAds(adPolicy, adUnits).catch(() => undefined);
  return started;
}

/** Tests only. */
export const resetAdsStart = () => {
  started = null;
};
