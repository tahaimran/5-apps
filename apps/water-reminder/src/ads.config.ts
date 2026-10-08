import type { AdPolicy, AdUnits } from '@shared/ads';

/**
 * Placement map from DEVELOPMENT_PLAN.md §12. Keep the `process.env.EXPO_PUBLIC_*` references
 * literal: Expo only inlines static ones. In dev builds @shared/ads always uses Google test IDs.
 */
export const adPolicy: Partial<AdPolicy> = {
  // "First 2 sessions" is an app rule (src/domain/adRules.ts counts launches), not a time grace.
  firstSessionGraceMs: 0,
  interstitialMinIntervalMs: 180_000, // >= 3 min since the last full-screen ad
  interstitialEveryNActions: 1,
  appOpenMinBackgroundMs: 4 * 60 * 60 * 1000, // warm start after >= 4 h away (and <= 1 per 4 h)
  maxInterstitialsPerSession: 1,
};

export const adUnits: AdUnits = {
  home_under_ring: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_HOME_UNDER_RING },
  history_list: { format: 'native', unitId: process.env.EXPO_PUBLIC_ADMOB_HISTORY_LIST },
  history_exit: { format: 'interstitial', unitId: process.env.EXPO_PUBLIC_ADMOB_HISTORY_EXIT },
  garden_unlock_skin: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_GARDEN_UNLOCK_SKIN },
  streak_freeze: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_STREAK_FREEZE },
  app_open_warm: { format: 'appOpen', unitId: process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_WARM },
};
