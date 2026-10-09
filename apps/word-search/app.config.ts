import type { ExpoConfig } from 'expo/config';

// Google's sample AdMob app ID, used until the real one is set in EAS (EXPO_PUBLIC_ADMOB_ANDROID_APP_ID).
const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config: ExpoConfig = {
  name: 'Word Search',
  slug: 'word-search',
  version: '1.0.0',
  scheme: 'wordsearch',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['android'],
  android: {
    // Keep in sync with promoPackages['word-search'] in packages/shared/src/crosspromo/catalog.ts.
    package: 'com.fiveapps.wordsearchlarge',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#1F5FAF',
    },
    // The ads SDK adds INTERNET, WAKE_LOCK and ACCESS_NETWORK_STATE. POST_NOTIFICATIONS and
    // RECEIVE_BOOT_COMPLETED are for the daily reminder (it survives a reboot). No exact alarms.
    permissions: ['POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'com.google.android.gms.permission.AD_ID'],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      // expo-audio adds these even with the microphone option off; two short sounds need none of them.
      'android.permission.RECORD_AUDIO',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    ],
  },
  plugins: [
    'expo-router',
    [
      'react-native-google-mobile-ads',
      { androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? TEST_ANDROID_APP_ID },
    ],
    ['expo-notifications', { color: '#1F5FAF' }],
    // Plays two short game sounds only: no recording, so no microphone permission.
    ['expo-audio', { microphonePermission: false }],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#FBF7EF',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#121417' },
      },
    ],
    ['expo-build-properties', { android: { compileSdkVersion: 36, targetSdkVersion: 36 } }],
  ],
  experiments: { typedRoutes: true },
  owner: 'tuahaimran',
  extra: { eas: { projectId: '96e829ed-1896-4422-bf1c-6b932abbeb8d' } },
};

export default config;
