import { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';

export type AdFormat = 'banner' | 'interstitial' | 'rewarded' | 'appOpen' | 'native';

/** Defaults from docs/ADMOB_PLAYBOOK.md §3. Apps override in `src/ads.config.ts`. */
export interface AdPolicy {
  /** Master switch (e.g. to turn ads off for a debug build). */
  adsEnabled: boolean;
  /** No interstitial/app-open in the first N ms of the first-ever session. */
  firstSessionGraceMs: number;
  /** Min gap between interstitials. 90 s for games; utilities use 180 s. */
  interstitialMinIntervalMs: number;
  /** Show an interstitial on every Nth `showInterstitial` call (e.g. every 2 levels). */
  interstitialEveryNActions: number;
  /** App-open ads only after the app was in the background at least this long. */
  appOpenMinBackgroundMs: number;
  maxInterstitialsPerSession: number;
  /** Keep a rewarded ad preloaded so it is ready when the user asks. */
  rewardedAlwaysAvailable: boolean;
  /** Content rating cap sent with every request. 13+ apps use 'T'. */
  maxAdContentRating: MaxAdContentRating;
  /** Register your own device so you never see live ads while testing. */
  testDeviceIds: string[];
}

export const defaultAdPolicy: AdPolicy = {
  adsEnabled: true,
  firstSessionGraceMs: 120_000,
  interstitialMinIntervalMs: 90_000,
  interstitialEveryNActions: 2,
  appOpenMinBackgroundMs: 30_000,
  maxInterstitialsPerSession: 6,
  rewardedAlwaysAvailable: true,
  maxAdContentRating: MaxAdContentRating.T,
  testDeviceIds: [],
};

export interface AdUnitConfig {
  format: AdFormat;
  /**
   * Real ad unit ID. Pass it as a literal env reference so Expo inlines it at build time:
   * `unitId: process.env.EXPO_PUBLIC_ADMOB_HOME_BANNER`. Ignored in `__DEV__`.
   */
  unitId?: string;
}

/** Map of placement name → unit. Use one unit per placement so eCPM can be compared. */
export type AdUnits = Record<string, AdUnitConfig>;

const TEST_IDS: Record<AdFormat, string> = {
  banner: TestIds.ADAPTIVE_BANNER,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
  appOpen: TestIds.APP_OPEN,
  native: TestIds.NATIVE,
};

/** In dev always the Google test IDs; in release only the configured real ID (no ID → no ad). */
export function resolveUnitId(unit: AdUnitConfig | undefined): string | null {
  if (!unit) return null;
  if (__DEV__) return TEST_IDS[unit.format];
  return unit.unitId ? unit.unitId : null;
}
