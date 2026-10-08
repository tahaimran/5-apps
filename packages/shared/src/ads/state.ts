import { AppState } from 'react-native';
import { sharedStore } from '../storage';
import { defaultAdPolicy, resolveUnitId, type AdFormat, type AdPolicy, type AdUnits } from './policy';

type Listener = () => void;

/** Module-level ads state shared by the components and the show* functions. */
export const adsState = {
  policy: defaultAdPolicy as AdPolicy,
  units: {} as AdUnits,
  /** True once consent allows requests and the Mobile Ads SDK is initialized. */
  ready: false,
  sessionStartedAt: Date.now(),
  isFirstSession: false,
  interstitialsShown: 0,
  lastInterstitialAt: 0,
  interstitialActions: 0,
  /** True while an interstitial/rewarded/app-open ad is on screen. */
  fullScreenActive: false,
  guard: null as ((placement: string) => boolean) | null,
};

const listeners = new Set<Listener>();
export const subscribeAds = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
let version = 0;
export const getAdsVersion = () => version;
export const notifyAds = () => {
  version++;
  listeners.forEach((l) => l());
};

export const unitIdFor = (placement: string, format: AdFormat): string | null => {
  const unit = adsState.units[placement];
  return unit && unit.format === format ? resolveUnitId(unit) : null;
};

export const placementsOf = (format: AdFormat): string[] =>
  Object.keys(adsState.units).filter((p) => adsState.units[p].format === format);

export const guardAllows = (placement: string): boolean => {
  try {
    return adsState.guard ? adsState.guard(placement) : true;
  } catch {
    return false;
  }
};

/** Ads may be requested at all (enabled, consent given, SDK ready). */
export const adsAvailable = () => adsState.policy.adsEnabled && adsState.ready;

export const inFirstSessionGrace = (): boolean =>
  adsState.isFirstSession && Date.now() - adsState.sessionStartedAt < adsState.policy.firstSessionGraceMs;

export const beginSession = () => {
  const count = (sharedStore.get('session.count') ?? 0) + 1;
  sharedStore.set('session.count', count);
  adsState.isFirstSession = count === 1;
  adsState.sessionStartedAt = Date.now();
  adsState.interstitialsShown = 0;
  adsState.lastInterstitialAt = 0;
  adsState.interstitialActions = 0;
};

export const appIsActive = () => AppState.currentState === 'active';
