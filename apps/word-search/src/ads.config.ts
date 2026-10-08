import { MaxAdContentRating } from 'react-native-google-mobile-ads';
import type { AdPolicy, AdUnits } from '@shared/ads';

/**
 * Placement map from DEVELOPMENT_PLAN.md §11. Keep the `process.env.EXPO_PUBLIC_*` references
 * literal: Expo only inlines static ones. In dev builds @shared/ads always uses Google test IDs.
 *
 * The "every 3 completed puzzles" and "6 an hour" rules live in src/domain/adRules.ts, which counts
 * puzzles itself; the shared layer is told to treat every call as eligible (every 1st action).
 */
export const adPolicy: Partial<AdPolicy> = {
  // "No ads until level 2 completes in the first session" is an app rule (adRules.ts), not a time grace.
  firstSessionGraceMs: 0,
  interstitialMinIntervalMs: 90_000, // >= 90 s since the last interstitial
  interstitialEveryNActions: 1,
  appOpenMinBackgroundMs: 4 * 60_000, // warm start after >= 4 min away
  maxInterstitialsPerSession: 100, // the hourly cap is an app rule
  // Older audience: PG at most (plan §11); the shared layer sends 'T' by default.
  maxAdContentRating: MaxAdContentRating.PG,
};

export const adUnits: AdUnits = {
  home_banner: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_HOME_BANNER },
  packs_banner: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_PACKS_BANNER },
  level_complete: { format: 'interstitial', unitId: process.env.EXPO_PUBLIC_ADMOB_LEVEL_COMPLETE },
  hint_refill: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_HINT_REFILL },
  app_open: { format: 'appOpen', unitId: process.env.EXPO_PUBLIC_ADMOB_APP_OPEN },
};
