import type { ExpoConfig } from 'expo/config';

// Google's sample AdMob app ID, used until the real one is set in EAS (EXPO_PUBLIC_ADMOB_ANDROID_APP_ID).
const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config: ExpoConfig = {
  name: 'Habits',
  slug: 'habit-tracker',
  version: '1.0.0',
  scheme: 'habittracker',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  platforms: ['android'],
  android: {
    // Keep in sync with promoPackages['habit-tracker'] in packages/shared/src/crosspromo/catalog.ts.
    package: 'com.fiveapps.habittracker',
    versionCode: 1,
    permissions: ['POST_NOTIFICATIONS'],
  },
  plugins: [
    'expo-router',
    [
      'react-native-google-mobile-ads',
      { androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? TEST_ANDROID_APP_ID },
    ],
    'expo-notifications',
    ['expo-build-properties', { android: { compileSdkVersion: 36, targetSdkVersion: 36 } }],
    [
      'react-native-android-widget',
      {
        widgets: [
          {
            name: 'TodayWidget',
            label: 'Habits: Today',
            description: 'Check off today\'s habits from your home screen.',
            minWidth: '250dp',
            minHeight: '110dp',
            targetCellWidth: 4,
            targetCellHeight: 2,
            resizeMode: 'horizontal|vertical',
            updatePeriodMillis: 1_800_000,
          },
        ],
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
