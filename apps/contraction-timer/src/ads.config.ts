import { MaxAdContentRating, type AdPolicy, type AdUnits } from '@shared/ads';

/**
 * Placement map from DEVELOPMENT_PLAN.md §12. Keep the `process.env.EXPO_PUBLIC_*` references literal:
 * Expo only inlines static ones. In dev builds @shared/ads always uses Google's test IDs; a placement with
 * no ID in a release build shows no ad. Real IDs come from EAS environment variables and are never committed.
 *
 * Every "never show when" rule (a timing or kick session is open, Partner mode, the Timer and Kicks screens...)
 * lives in src/domain/adRules.ts and is installed as the ad guard (src/ads/guard.ts).
 */
export const adPolicy: Partial<AdPolicy> = {
  // The day-0 and first-launch rules are app rules (adRules.ts), not a time grace.
  firstSessionGraceMs: 0,
  // Plan §12: at least 3 minutes between interstitials.
  interstitialMinIntervalMs: 3 * 60_000,
  interstitialEveryNActions: 1,
  // App-open ads only after the app was away for 4 hours.
  appOpenMinBackgroundMs: 4 * 60 * 60_000,
  // The 4-a-day cap is an app rule.
  maxInterstitialsPerSession: 100,
  // Plan §12: maximum ad content rating G.
  maxAdContentRating: MaxAdContentRating.G,
};

export const adUnits: AdUnits = {
  history_banner: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_HISTORY_BANNER },
  week_banner: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_WEEK_BANNER },
  checklist_banner: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_CHECKLIST_BANNER },
  week_native: { format: 'native', unitId: process.env.EXPO_PUBLIC_ADMOB_WEEK_NATIVE },
  pdf_theme_reward: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_PDF_THEME_REWARD },
  checklist_template_reward: { format: 'rewarded', unitId: process.env.EXPO_PUBLIC_ADMOB_CHECKLIST_TEMPLATE_REWARD },
  week_close_interstitial: { format: 'interstitial', unitId: process.env.EXPO_PUBLIC_ADMOB_WEEK_CLOSE_INTERSTITIAL },
  app_open: { format: 'appOpen', unitId: process.env.EXPO_PUBLIC_ADMOB_APP_OPEN },
};
