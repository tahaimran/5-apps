import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { onFullScreenAdShown, setAdGuard } from '@shared/ads';
import { sharedStore } from '@shared/storage';
import { adAllowed, type AdContext, type AdScreen } from '@/domain/adRules';
import { useAds, interstitialsToday } from '@/store/ads';
import { db } from '@/store/storage';
import { currentDateKey } from '@/store/today';
import { useAdCounters, useStats } from '@/store/stores';

/** When this app process started (the "60 s into the session" rule). */
let processStart = Date.now();

/** Tests only: pretend the process started at this time. */
export const setProcessStartForTests = (ms: number) => {
  processStart = ms;
};

/** Everything the rules need, read right now (never a value captured earlier). */
export function adContext(): AdContext {
  const ads = useAds.getState();
  const counters = useAdCounters.getState().value;
  const stats = useStats.getState().value;
  const now = Date.now();
  return {
    now,
    today: currentDateKey(),
    onboardingDone: sharedStore.get('onboarding.completedAt') !== undefined && db.get('onboarding.done') === true,
    firstSession: stats.sessions <= 1,
    sessionAgeMs: now - processStart,
    installAgeMs: now - stats.firstOpenAt,
    screen: ads.screen,
    roundsSinceInterstitial: counters.roundsSinceInterstitial,
    lastFullScreenAt: ads.lastFullScreenAt,
    lastRewardedAt: ads.lastRewardedAt,
    lastAppOpenAt: counters.lastAppOpenAt,
    interstitialsToday: interstitialsToday(),
    lastExternalOpenAt: ads.lastExternalOpenAt,
  };
}

/**
 * Installs the app-level veto for @shared/ads and keeps the counters exact by listening for ads that
 * really closed (interstitial, rewarded and app open all count toward the 90 s gap).
 */
let currentGuard: ((placement: string) => boolean) | null = null;

/** Re-announces the guard so mounted banners and native cards check the rules again (the screen just changed). */
export const refreshAdGuard = () => {
  if (currentGuard) setAdGuard(currentGuard);
};

export function installAdGuard(): () => void {
  currentGuard = (placement) => adAllowed(placement, adContext());
  setAdGuard(currentGuard);
  const off = onFullScreenAdShown((kind) => useAds.getState().recordShown(kind));
  const link = Linking.addEventListener('url', () => useAds.getState().markExternalOpen());
  return () => {
    currentGuard = null;
    setAdGuard(null);
    off();
    link.remove();
  };
}

export function useAdGuard() {
  useEffect(() => installAdGuard(), []);
}

/** Tells the guard which screen is in front (banners and the interstitial are screen-specific). */
export function useAdScreen(screen: AdScreen) {
  useFocusEffect(
    useCallback(() => {
      useAds.getState().setScreen(screen);
      refreshAdGuard();
      return undefined;
    }, [screen]),
  );
}
