import { useEffect } from 'react';
import { Linking } from 'react-native';
import { setAdGuard } from '@shared/ads';
import { sharedStore } from '@shared/storage';
import { adAllowed, type AdContext } from '@/domain/adRules';
import { dayKeyFor } from '@/domain/dayKey';
import { useCelebration } from '@/store/celebrations';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { useWater } from '@/store/water';

let lastLogAt: number | null = null;
let lastExternalOpenAt: number | null = null;
let lastInterruptionAt: number | null = null;

/** Clears the remembered moments (tests, and a fresh session). */
export const resetAdGuardState = () => {
  lastLogAt = null;
  lastExternalOpenAt = null;
  lastInterruptionAt = null;
};

/** A launch from a reminder notification, a deep link or a widget: no app-open ad, no interstitial for a while. */
export const markExternalOpen = () => {
  lastExternalOpenAt = Date.now();
};
/** A rewarded ad or the system permission dialog just closed. */
export const markInterruption = () => {
  lastInterruptionAt = Date.now();
};

export const interstitialsToday = (): number => {
  const day = dayKeyFor(new Date(), useSettings.getState().reminders.wakeMin);
  const shown = useSettings.getState().prefs.fullScreenToday;
  return shown?.day === day ? shown.count : 0;
};

/** Counts an interstitial that was really shown, for the 4-a-day cap. */
export function recordInterstitialShown(): void {
  const day = dayKeyFor(new Date(), useSettings.getState().reminders.wakeMin);
  useSettings.getState().setPrefs({ fullScreenToday: { day, count: interstitialsToday() + 1 } });
}

export const hasLoggedAny = (): boolean => Object.keys(useWater.getState().summaries).length > 0;

export function adContext(): AdContext {
  return {
    now: Date.now(),
    onboardingActive: sharedStore.get('onboarding.completedAt') === undefined,
    hasLoggedGlass: hasLoggedAny(),
    launches: useMeta.getState().meta.launches,
    lastLogAt,
    lastExternalOpenAt,
    celebrationPlaying: useCelebration.getState().current !== null,
    lastInterruptionAt,
    interstitialsToday: interstitialsToday(),
  };
}

/** Installs the app-level veto for @shared/ads and tracks what it needs to decide. */
export function installAdGuard(): () => void {
  setAdGuard((placement) => adAllowed(placement, adContext()));
  const link = Linking.addEventListener('url', markExternalOpen);
  let previous = useWater.getState().summaries;
  const unsubscribe = useWater.subscribe((state) => {
    if (state.summaries !== previous) lastLogAt = Date.now();
    previous = state.summaries;
  });
  return () => {
    setAdGuard(null);
    link.remove();
    unsubscribe();
  };
}

export function useAdGuard() {
  useEffect(() => installAdGuard(), []);
}
