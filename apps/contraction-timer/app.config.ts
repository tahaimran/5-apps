import type { ExpoConfig } from 'expo/config';

// Google's sample AdMob app ID, used until the real one is set in EAS (EXPO_PUBLIC_ADMOB_ANDROID_APP_ID).
const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config: ExpoConfig = {
  name: 'Contraction Timer',
  slug: 'contraction-timer',
  version: '1.0.0',
  scheme: 'contractiontimer',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // The app has its own light, dark and night themes (Settings); the system value is only the default.
  userInterfaceStyle: 'automatic',
  platforms: ['android'],
  android: {
    // Keep in sync with promoPackages['contraction-timer'] in packages/shared/src/crosspromo/catalog.ts.
    package: 'com.fiveapps.contractiontimer',
    versionCode: 1,
    // Health entries are kept on the phone only. Android's automatic backup would copy them to the person's Google account
    // (and onto a new phone), which is a transfer the app's "nothing leaves the phone" promise does not cover, so it is off.
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#FBF7F4',
    },
    // POST_NOTIFICATIONS: the optional kick reminder (asked for only when the person turns it on).
    // VIBRATE: haptics. AD_ID: declared for AdMob. The ads SDK adds INTERNET, ACCESS_NETWORK_STATE and WAKE_LOCK, and
    // expo-notifications adds RECEIVE_BOOT_COMPLETED so the daily reminder survives a reboot; expo-keep-awake adds none.
    // No exact alarms: the kick reminder is an inexact daily trigger.
    permissions: ['POST_NOTIFICATIONS', 'VIBRATE', 'com.google.android.gms.permission.AD_ID'],
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
    ['expo-notifications', { color: '#3E9C95' }],
    'expo-sharing',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#FBF7F4',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#141519' },
      },
    ],
    ['expo-build-properties', { android: { compileSdkVersion: 36, targetSdkVersion: 36 } }],
  ],
  experiments: { typedRoutes: true },
  owner: 'tuahaimran',
  extra: { eas: { projectId: 'de5cce48-e4fa-48be-973f-67b693aa0b05' } },
};

export default config;
