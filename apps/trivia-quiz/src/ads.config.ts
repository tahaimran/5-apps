import { MaxAdContentRating, type AdPolicy, type AdUnits } from '@shared/ads';

/**
 * Placement map from DEVELOPMENT_PLAN.md §12. Keep the `process.env.EXPO_PUBLIC_*` references
 * literal: Expo only inlines static ones. In dev builds @shared/ads always uses Google test IDs.
 *
 * "Every 2 completed rounds", "8 a day", "90 s since any full-screen ad" and the never-show rules live in
 * src/domain/adRules.ts, which counts rounds itself; the shared layer is told to treat every call as
 * eligible (every 1st action, no first-session grace of its own).
 */
export const adPolicy: Partial<AdPolicy> = {
  // "No ads in the first session / first 60 s" are app rules (adRules.ts), not a time grace.
  firstSessionGraceMs: 0,
  interstitialMinIntervalMs: 90_000,
  interstitialEveryNActions: 1,
  appOpenMinBackgroundMs: 4 * 60 * 60_000, // warm start after >= 4 h away (plan §12)
  maxInterstitialsPerSession: 100, // the daily cap is an app rule
  // Plan §12: max ad content rating T, which is the shared default; stated here so it is explicit.
  maxAdContentRating: MaxAdContentRating.T,
};

export const adUnits: AdUnits = {
  menu: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_MENU },
  round_end: { format: 'interstitial', unitId: process.env.EXPO_PUBLIC_ADMOB_ROUND_END },
  lifeline: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_LIFELINE },
  extra_life: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_EXTRA_LIFE },
  double_xp: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_DOUBLE_XP },
  streak_restore: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_STREAK_RESTORE },
  app_open: { format: 'appOpen', unitId: process.env.EXPO_PUBLIC_ADMOB_APP_OPEN },
  results_native: { format: 'native', unitId: process.env.EXPO_PUBLIC_ADMOB_RESULTS_NATIVE },
};
