import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { onFullScreenAdShown, setAdGuard } from '@shared/ads';
import { sharedStore } from '@shared/storage';
import { adAllowed, type AdContext, type AdScreen } from '@/domain/adRules';
import { useAds } from '@/store/ads';
import { useGame } from '@/store/game';
import { useResult } from '@/store/result';
import { useStats } from '@/store/stats';
import { db } from '@/store/storage';

/** Everything the rules need, read right now (never a value captured earlier). */
export function adContext(): AdContext {
  const ads = useAds.getState();
  const stats = useStats.getState().stats;
  return {
    now: Date.now(),
    setupDone: sharedStore.get('onboarding.completedAt') !== undefined && db.get('onboarding.tutorialDone') === true,
    firstSession: stats.sessions <= 1,
    puzzlesCompleted: stats.puzzlesCompleted,
    screen: ads.screen,
    puzzleInProgress: useGame.getState().current !== null,
    levelsSinceInterstitial: ads.counters.levelsSinceInterstitial,
    lastFullScreenAt: ads.lastFullScreenAt,
    lastRewardedAt: ads.lastRewardedAt,
    lastAppOpenAt: ads.counters.lastAppOpenAt,
    interstitialTimes: ads.counters.interstitialTimes,
    completedDaily: useResult.getState().last?.isDaily === true,
    lastExternalOpenAt: ads.lastExternalOpenAt,
  };
}

/**
 * Installs the app-level veto for @shared/ads and keeps the counters exact by listening for ads that
 * really closed (interstitial, rewarded and app open all count toward the 90 s gap).
 */
export function installAdGuard(): () => void {
  setAdGuard((placement) => adAllowed(placement, adContext()));
  const off = onFullScreenAdShown((kind) => useAds.getState().recordShown(kind));
  const link = Linking.addEventListener('url', () => useAds.getState().markExternalOpen());
  return () => {
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
      return undefined;
    }, [screen]),
  );
}
