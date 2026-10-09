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
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#FBF7F4',
    },
    // POST_NOTIFICATIONS: the optional kick reminder (asked for only when the person turns it on).
    // VIBRATE: haptics. AD_ID: declared for AdMob. The ads SDK and expo-keep-awake add INTERNET,
    // ACCESS_NETWORK_STATE and WAKE_LOCK. No exact alarms: the kick reminder is an inexact daily trigger.
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
};

export default config;
