import type { ExpoConfig } from 'expo/config';

// Google's sample AdMob app ID, used until the real one is set in EAS (EXPO_PUBLIC_ADMOB_ANDROID_APP_ID).
const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config: ExpoConfig = {
  name: 'Habits',
  slug: 'habit-tracker',
  version: '1.0.0',
  scheme: 'habittracker',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['android'],
  android: {
    // Keep in sync with promoPackages['habit-tracker'] in packages/shared/src/crosspromo/catalog.ts.
    package: 'com.fiveapps.habittracker',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#6C4CF1',
    },
    // Exactly what the plan's permissions review allows (INTERNET, WAKE_LOCK and
    // ACCESS_NETWORK_STATE come from the ads SDK). No exact alarms, no storage, no overlays.
    permissions: ['POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'com.google.android.gms.permission.AD_ID'],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
    ],
  },
  plugins: [
    'expo-router',
    [
      'react-native-google-mobile-ads',
      { androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? TEST_ANDROID_APP_ID },
    ],
    'expo-notifications',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#FAF8F5',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0F1115' },
      },
    ],
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
