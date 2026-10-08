export type PromoAppId = 'habit-tracker' | 'water-reminder' | 'word-search' | 'trivia-quiz' | 'contraction-timer';

/**
 * Play Store application IDs of the 5 apps. Keep in sync with `android.package` in each
 * app's app.json (update here if a package name changes before publishing).
 */
export const promoPackages: Record<PromoAppId, string> = {
  'habit-tracker': 'com.fiveapps.habittracker',
  'water-reminder': 'com.fiveapps.sipling',
  'word-search': 'com.fiveapps.wordsearchlarge',
  'trivia-quiz': 'com.fiveapps.quizora',
  'contraction-timer': 'com.fiveapps.contractiontimer',
};

export const promoIds = Object.keys(promoPackages) as PromoAppId[];

export const playStoreUrl = (id: PromoAppId): string =>
  `https://play.google.com/store/apps/details?id=${promoPackages[id]}&referrer=utm_source%3Dcrosspromo%26utm_medium%3Dhouse_ad`;
