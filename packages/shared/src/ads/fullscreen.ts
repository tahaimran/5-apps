import {
  AdEventType,
  AppOpenAd,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { adsAvailable, adsState, guardAllows, inFirstSessionGrace, notifyAds, unitIdFor } from './state';

const requestOptions = () => ({ requestNonPersonalizedAdsOnly: false });

type FullScreenAd = InterstitialAd | RewardedAd | AppOpenAd;

interface Slot<A extends FullScreenAd> {
  ad: A | null;
  loaded: boolean;
  loading: boolean;
}

const interstitials = new Map<string, Slot<InterstitialAd>>();
const rewardeds = new Map<string, Slot<RewardedAd>>();
let appOpen: Slot<AppOpenAd> = { ad: null, loaded: false, loading: false };

function loadInterstitial(placement: string) {
  const unitId = unitIdFor(placement, 'interstitial');
  if (!unitId) return;
  const slot = interstitials.get(placement) ?? { ad: null, loaded: false, loading: false };
  interstitials.set(placement, slot);
  if (slot.loading || slot.loaded) return;
  slot.loading = true;
  const ad = InterstitialAd.createForAdRequest(unitId, requestOptions());
  slot.ad = ad;
  const off = ad.addAdEventListener(AdEventType.LOADED, () => {
    slot.loaded = true;
    slot.loading = false;
    off();
  });
  const offErr = ad.addAdEventListener(AdEventType.ERROR, () => {
    slot.loading = false;
    offErr();
  });
  ad.load();
}

function loadRewarded(placement: string) {
  const unitId = unitIdFor(placement, 'rewarded');
  if (!unitId) return;
  const slot = rewardeds.get(placement) ?? { ad: null, loaded: false, loading: false };
  rewardeds.set(placement, slot);
  if (slot.loading || slot.loaded) return;
  slot.loading = true;
  const ad = RewardedAd.createForAdRequest(unitId, requestOptions());
  slot.ad = ad;
  const off = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    slot.loaded = true;
    slot.loading = false;
    off();
  });
  const offErr = ad.addAdEventListener(AdEventType.ERROR, () => {
    slot.loading = false;
    offErr();
  });
  ad.load();
}

export function loadAppOpen() {
  const placement = Object.keys(adsState.units).find((p) => adsState.units[p].format === 'appOpen');
  const unitId = placement ? unitIdFor(placement, 'appOpen') : null;
  if (!unitId || appOpen.loading || appOpen.loaded) return;
  appOpen.loading = true;
  const ad = AppOpenAd.createForAdRequest(unitId, requestOptions());
  appOpen.ad = ad;
  const off = ad.addAdEventListener(AdEventType.LOADED, () => {
    appOpen.loaded = true;
    appOpen.loading = false;
    off();
  });
  const offErr = ad.addAdEventListener(AdEventType.ERROR, () => {
    appOpen.loading = false;
    offErr();
  });
  ad.load();
}

/** Preload every configured full-screen placement. Called once the SDK is ready. */
export function preloadAll() {
  for (const p of Object.keys(adsState.units)) {
    const format = adsState.units[p].format;
    if (format === 'interstitial') loadInterstitial(p);
    else if (format === 'rewarded' && adsState.policy.rewardedAlwaysAvailable) loadRewarded(p);
  }
  loadAppOpen();
}

export type FullScreenKind = 'interstitial' | 'rewarded' | 'appOpen';

const shownListeners = new Set<(kind: FullScreenKind) => void>();

/**
 * Called each time a full-screen ad was really shown and closed (not for ads that failed to show).
 * Apps use it to keep their own cross-format rules exact, such as "90 s since any full-screen ad".
 * Returns an unsubscribe function.
 */
export function onFullScreenAdShown(listener: (kind: FullScreenKind) => void): () => void {
  shownListeners.add(listener);
  return () => {
    shownListeners.delete(listener);
  };
}

/** Resolves true when the ad was shown and then closed, false on any failure. */
function present(fullScreenAd: FullScreenAd, kind: FullScreenKind): Promise<boolean> {
  const ad = fullScreenAd as {
    addAdEventListener(type: AdEventType, listener: () => void): () => void;
    show(): Promise<void>;
  };
  return new Promise((resolve) => {
    adsState.fullScreenActive = true;
    const finish = (shown: boolean) => {
      adsState.fullScreenActive = false;
      if (shown) {
        adsState.fullScreenShown++;
        for (const listener of [...shownListeners]) {
          try {
            listener(kind);
          } catch {
            // a faulty listener must not break ad delivery
          }
        }
      }
      offClosed();
      offErr();
      notifyAds();
      resolve(shown);
    };
    const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    const offErr = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
    ad.show().catch(() => finish(false));
  });
}

/**
 * Shows an interstitial if every rule allows it: ads available, app guard, first-session grace,
 * every-Nth-action, min interval, per-session cap and an ad already preloaded.
 * Returns false (without blocking) when skipped; true after the ad was shown and closed.
 */
export async function showInterstitial(placement: string): Promise<boolean> {
  const p = adsState.policy;
  if (!adsAvailable() || !unitIdFor(placement, 'interstitial')) return false;
  adsState.interstitialActions++;
  if (adsState.interstitialActions % Math.max(1, p.interstitialEveryNActions) !== 0) return false;
  if (!guardAllows(placement) || adsState.fullScreenActive) return false;
  if (inFirstSessionGrace()) return false;
  if (adsState.interstitialsShown >= p.maxInterstitialsPerSession) return false;
  if (Date.now() - adsState.lastInterstitialAt < p.interstitialMinIntervalMs) return false;

  const slot = interstitials.get(placement);
  if (!slot?.loaded || !slot.ad) {
    loadInterstitial(placement);
    return false;
  }
  const ad = slot.ad;
  slot.ad = null;
  slot.loaded = false;
  const shown = await present(ad, 'interstitial');
  // Only an ad that really appeared counts toward the caps; the gap is measured from when it closed.
  if (shown) {
    adsState.interstitialsShown++;
    adsState.lastInterstitialAt = Date.now();
  }
  loadInterstitial(placement);
  return shown;
}

const REWARDED_WAIT_MS = 6_000;

/**
 * Opt-in rewarded ad. Ignores frequency caps (the user asked for it). The reward is only
 * granted on the EARNED_REWARD event, so `rewarded` is false if the user closes early.
 */
export async function showRewarded(placement: string): Promise<{ rewarded: boolean }> {
  if (!adsAvailable() || !unitIdFor(placement, 'rewarded') || adsState.fullScreenActive) {
    return { rewarded: false };
  }
  loadRewarded(placement);
  const slot = rewardeds.get(placement);
  if (!slot) return { rewarded: false };

  const deadline = Date.now() + REWARDED_WAIT_MS;
  while (!slot.loaded && slot.loading && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!slot.loaded || !slot.ad) return { rewarded: false };

  const ad = slot.ad;
  slot.ad = null;
  slot.loaded = false;
  let rewarded = false;
  const offReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    rewarded = true;
  });
  await present(ad, 'rewarded');
  offReward();
  loadRewarded(placement);
  return { rewarded };
}

/** Whether a rewarded ad is ready right now (for enabling the "Watch ad" button). */
export function isRewardedReady(placement: string): boolean {
  return !!rewardeds.get(placement)?.loaded;
}

/** Called by useAppOpenAd when the app returns to the foreground. */
export async function maybeShowAppOpen(placementGuard = 'app_open'): Promise<boolean> {
  if (!adsAvailable() || adsState.fullScreenActive) return false;
  if (!guardAllows(placementGuard) || inFirstSessionGrace()) return false;
  if (!appOpen.loaded || !appOpen.ad) {
    loadAppOpen();
    return false;
  }
  const ad = appOpen.ad;
  appOpen = { ad: null, loaded: false, loading: false };
  const shown = await present(ad, 'appOpen');
  loadAppOpen();
  return shown;
}
