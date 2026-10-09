import { useCallback, useEffect, useState } from 'react';
import { Keyboard, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { onFullScreenAdShown, setAdGuard } from '@shared/ads';
import { sharedStore } from '@shared/storage';
import { adAllowed, decideRewarded, type AdContext, type AdScreen, type Decision } from '@/domain/adRules';
import { dateKeyFor } from '@/domain/dateKey';
import { onNotificationOpen } from '@/notifications/responses';
import { useAds } from '@/store/ads';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';

/** Everything the rules need, read right now (never a value captured earlier). */
export function adContext(now: number = Date.now()): AdContext {
  const ads = useAds.getState();
  const meta = useMeta.getState().meta;
  return {
    now,
    setupDone: sharedStore.get('onboarding.completedAt') !== undefined && meta.disclaimerAckAt !== undefined,
    launches: meta.launches,
    installDay: dateKeyFor(new Date(meta.installAt)),
    today: dateKeyFor(new Date(now)),
    screen: ads.screen,
    keyboardOpen: ads.keyboardOpen,
    sessionOpen: useSessions.getState().active !== null,
    kickOpen: useKicks.getState().active !== null,
    partnerMode: useSettings.getState().settings.partnerMode,
    lastSessionEndedAt: meta.lastSessionEndedAt ?? 0,
    lastFullScreenAt: ads.lastFullScreenAt,
    lastAppOpenAt: ads.state.lastAppOpenAt ?? 0,
    interstitialsToday: ads.state.interstitialsToday,
    interstitialsDay: ads.state.day,
    lastExternalOpenAt: ads.lastExternalOpenAt,
    articleClosedAt: ads.articleClosedAt,
    articleReadMs: ads.articleReadMs,
  };
}

/** Can this rewarded button work right now? Off during a session or a kick count ("Available after your session"). */
export const rewardedDecision = (placement: string): Decision => decideRewarded(placement, adContext());

/**
 * Installs the app-level veto for @shared/ads (banners, native cards, interstitials, app-open) and keeps the counters exact by
 * listening for ads that really closed. Opening the app from a notification or a link counts as an "external open".
 */
export function installAdGuard(): () => void {
  setAdGuard((placement) => adAllowed(placement, adContext()));
  const off = onFullScreenAdShown((kind) => useAds.getState().recordShown(kind));
  const link = Linking.addEventListener('url', () => useAds.getState().markExternalOpen());
  const note = onNotificationOpen(() => useAds.getState().markExternalOpen());
  const show = Keyboard.addListener('keyboardDidShow', () => useAds.getState().setKeyboard(true));
  const hide = Keyboard.addListener('keyboardDidHide', () => useAds.getState().setKeyboard(false));
  return () => {
    setAdGuard(null);
    off();
    link.remove();
    note();
    show.remove();
    hide.remove();
  };
}

export function useAdGuard() {
  useEffect(() => installAdGuard(), []);
}

/**
 * Tells the guard which screen is in front (banners are screen-specific, and the Timer, Kicks and onboarding never show ads).
 * Returns false until that has been done: an ad drawn before the guard knows the screen would be refused and then never asked
 * again, so list rows that hold an ad wait for this.
 */
export function useAdScreen(screen: AdScreen): boolean {
  const [ready, setReady] = useState(false);
  useFocusEffect(
    useCallback(() => {
      useAds.getState().setScreen(screen);
      setReady(true);
      return () => setReady(false);
    }, [screen]),
  );
  return ready;
}
