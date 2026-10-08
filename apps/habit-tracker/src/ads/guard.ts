import { useEffect, useRef } from 'react';
import { AppState, Linking } from 'react-native';
import { initAds, setAdGuard } from '@shared/ads';
import { sharedStore } from '@shared/storage';
import { adPolicy, adUnits } from '@/ads.config';
import { adAllowed, type AdContext } from '@/domain/adRules';
import { useHabits } from '@/store/habits';
import { useProfile } from '@/store/profile';

let appForegroundAt = Date.now();
let lastCheckInAt: number | null = null;
let lastRewardedAt: number | null = null;
let lastExternalOpenAt: number | null = null;

/** A launch from a notification or the widget: no app-open ad for a few seconds. */
export const markExternalOpen = () => {
  lastExternalOpenAt = Date.now();
};
export const markRewardedShown = () => {
  lastRewardedAt = Date.now();
};

/** Any real check-in (not just a streak freeze) in the given entries. */
export const hasCheckInIn = (all: ReturnType<typeof useHabits.getState>['entries']): boolean => {
  for (const entries of Object.values(all)) {
    for (const e of Object.values(entries)) if (e.value > 0 && !e.frozen) return true;
  }
  return false;
};
export const hasAnyCheckIn = (): boolean => hasCheckInIn(useHabits.getState().entries);

export function adContext(): AdContext {
  const { habits } = useHabits.getState();
  return {
    now: Date.now(),
    onboardingDone: sharedStore.get('onboarding.completedAt') !== undefined,
    hasCheckedIn: hasAnyCheckIn(),
    habitCount: Object.values(habits).filter((h) => !h.archivedAt).length,
    openDays: useProfile.getState().profile.openDays.length,
    appForegroundAt,
    lastCheckInAt,
    lastRewardedAt,
    lastExternalOpenAt,
  };
}

/** Installs the app-level veto for @shared/ads and tracks what it needs to decide. */
export function installAdGuard(): () => void {
  setAdGuard((placement) => adAllowed(placement, adContext()));

  const app = AppState.addEventListener('change', (state) => {
    if (state === 'active') appForegroundAt = Date.now();
  });
  const link = Linking.addEventListener('url', markExternalOpen);
  let previous = useHabits.getState().entries;
  const unsubscribe = useHabits.subscribe((state) => {
    if (state.entries !== previous) lastCheckInAt = Date.now();
    previous = state.entries;
  });

  return () => {
    setAdGuard(null);
    app.remove();
    link.remove();
    unsubscribe();
  };
}

const FIRST_CHECKIN_CONSENT_DELAY_MS = 5000;

/**
 * Starts consent (UMP) and the ads SDK after the first-value moment: onboarding is done and the
 * user has checked something off. When that happens live in this session the form waits a few
 * seconds so it never lands on top of the first celebration.
 */
export function useAdsStart(checkedIn: boolean, onboardingDone: boolean) {
  const checkedInAtMount = useRef(checkedIn);
  useEffect(() => {
    if (!onboardingDone || !checkedIn) return;
    const delay = checkedInAtMount.current ? 0 : FIRST_CHECKIN_CONSENT_DELAY_MS;
    const timer = setTimeout(() => void initAds(adPolicy, adUnits).catch(() => undefined), delay);
    return () => clearTimeout(timer);
  }, [onboardingDone, checkedIn]);
}
