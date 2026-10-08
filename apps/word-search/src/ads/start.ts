import { initAds } from '@shared/ads';
import { adPolicy, adUnits } from '@/ads.config';

let started: Promise<void> | null = null;

/**
 * Runs consent (UMP) and then starts the ads SDK. Called once: right after the setup screens on a
 * first run (plan §6 screen 4, before the first puzzle), or at launch when setup is already done.
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
