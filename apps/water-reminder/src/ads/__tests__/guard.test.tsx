import '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { sharedStore } from '@shared/storage';
import { adAllowed } from '@/domain/adRules';
import { useCelebration } from '@/store/celebrations';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { useWater } from '@/store/water';
import { adContext, installAdGuard, interstitialsToday, markExternalOpen, markInterruption, recordInterstitialShown, resetAdGuardState } from '../guard';

let removeGuard: (() => void) | null = null;
const guardFn = () => {
  const { adsState } = require('@shared/ads/state') as typeof import('@shared/ads/state');
  return adsState.guard;
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 12, 0), doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(new Date(2026, 9, 8, 12, 0));
  resetAdGuardState();
  sharedStore.remove('onboarding.completedAt');
  useCelebration.setState({ current: null });
});
afterEach(() => {
  removeGuard?.();
  removeGuard = null;
  jest.useRealTimers();
});

describe('ad context', () => {
  it('reads onboarding, first glass, launches and the celebration from the app state', () => {
    expect(adContext()).toMatchObject({ onboardingActive: true, hasLoggedGlass: false, launches: 0, celebrationPlaying: false });
    sharedStore.set('onboarding.completedAt', 1);
    useWater.getState().logDrink({ volumeMl: 250 });
    useMeta.setState({ meta: { ...useMeta.getState().meta, launches: 5 } });
    useCelebration.getState().show({ kind: 'goal' });
    expect(adContext()).toMatchObject({ onboardingActive: false, hasLoggedGlass: true, launches: 5, celebrationPlaying: true });
  });
  it('remembers external opens and interruptions', () => {
    markExternalOpen();
    markInterruption();
    const c = adContext();
    expect(c.lastExternalOpenAt).toBe(Date.now());
    expect(c.lastInterruptionAt).toBe(Date.now());
  });
  it('counts interstitials per logical day for the 4 a day cap', () => {
    expect(interstitialsToday()).toBe(0);
    recordInterstitialShown();
    recordInterstitialShown();
    expect(interstitialsToday()).toBe(2);
    expect(useSettings.getState().prefs.fullScreenToday).toEqual({ day: '2026-10-08', count: 2 });
    jest.setSystemTime(new Date(2026, 9, 9, 12, 0));
    expect(interstitialsToday()).toBe(0);
  });
});

describe('installed veto', () => {
  it('blocks the banner until the first glass is logged, then allows it', () => {
    sharedStore.set('onboarding.completedAt', 1);
    removeGuard = installAdGuard();
    expect(guardFn()?.('home_under_ring')).toBe(false);
    useWater.getState().logDrink({ volumeMl: 250 });
    expect(guardFn()?.('home_under_ring')).toBe(true);
  });
  it('blocks full-screen ads right after a log and during onboarding', () => {
    useMeta.setState({ meta: { ...useMeta.getState().meta, launches: 9 } });
    useWater.getState().logDrink({ volumeMl: 250 });
    removeGuard = installAdGuard();
    expect(guardFn()?.('history_exit')).toBe(false); // onboarding not complete
    sharedStore.set('onboarding.completedAt', 1);
    useWater.getState().logDrink({ volumeMl: 250 });
    expect(guardFn()?.('history_exit')).toBe(false); // just logged
    jest.setSystemTime(new Date(2026, 9, 8, 12, 5));
    expect(guardFn()?.('history_exit')).toBe(true);
    expect(adAllowed('history_exit', adContext())).toBe(true);
  });
  it('removes the veto when uninstalled', () => {
    removeGuard = installAdGuard();
    expect(guardFn()).not.toBeNull();
    removeGuard();
    removeGuard = null;
    expect(guardFn()).toBeNull();
  });
});
