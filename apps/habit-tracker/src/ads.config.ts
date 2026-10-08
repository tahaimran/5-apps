import type { AdPolicy, AdUnits } from '@shared/ads';

/**
 * Placement map from DEVELOPMENT_PLAN.md §12. Keep the `process.env.EXPO_PUBLIC_*` references
 * literal: Expo only inlines static ones. In dev builds @shared/ads always uses Google test IDs.
 */
export const adPolicy: Partial<AdPolicy> = {
  firstSessionGraceMs: 24 * 60 * 60 * 1000, // no interstitial/app-open until the second day
  interstitialMinIntervalMs: 180_000, // utilities: >= 3 min
  interstitialEveryNActions: 1,
  appOpenMinBackgroundMs: 4 * 60 * 60 * 1000, // warm start after >4h away
  maxInterstitialsPerSession: 6,
};

export const adUnits: AdUnits = {
  today_bottom: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_TODAY_BOTTOM },
  stats_list: { format: 'native', unitId: process.env.EXPO_PUBLIC_ADMOB_STATS_LIST },
  leave_stats: { format: 'interstitial', unitId: process.env.EXPO_PUBLIC_ADMOB_LEAVE_STATS },
  after_edit: { format: 'interstitial', unitId: process.env.EXPO_PUBLIC_ADMOB_AFTER_EDIT },
  streak_freeze: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_STREAK_FREEZE },
  theme_unlock: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_THEME_UNLOCK },
  app_open_warm: { format: 'appOpen', unitId: process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_WARM },
};
