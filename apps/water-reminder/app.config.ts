import type { ExpoConfig } from 'expo/config';

// Google's sample AdMob app ID, used until the real one is set in EAS (EXPO_PUBLIC_ADMOB_ANDROID_APP_ID).
const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config: ExpoConfig = {
  name: 'Sipling',
  slug: 'water-reminder',
  version: '1.0.0',
  scheme: 'sipling',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['android'],
  android: {
    // Keep in sync with promoPackages['water-reminder'] in packages/shared/src/crosspromo/catalog.ts.
    package: 'com.fiveapps.sipling',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#2B9FE6',
    },
    // Exactly what plan §18 allows (INTERNET, WAKE_LOCK and ACCESS_NETWORK_STATE come from the ads
    // SDK). No exact alarms, no battery-optimization prompt, no storage, no overlays.
    permissions: ['POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'com.google.android.gms.permission.AD_ID'],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    ],
  },
  plugins: [
    'expo-router',
    [
      'react-native-google-mobile-ads',
      { androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? TEST_ANDROID_APP_ID },
    ],
    // `drop.wav` is the reminder sound of the "Water reminders" channel.
    ['expo-notifications', { sounds: ['./assets/sounds/drop.wav'], color: '#2B9FE6' }],
    'expo-background-task',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#F4FAFE',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0E1A24' },
      },
    ],
    ['expo-build-properties', { android: { compileSdkVersion: 36, targetSdkVersion: 36 } }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
