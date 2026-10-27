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
    package: 'com.tahaimran.wordsearch',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      backgroundImage: './assets/adaptive-icon-background.png',
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
      // expo-audio adds these even with the microphone option off; short game sounds need none of them.
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
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1F5FAF',
        // Bundled into res/raw; the daily reminder's chime channel refers to it by file name (src/notifications/reminder.ts).
        sounds: ['../../packages/shared/assets/sounds/reminder.wav'],
      },
    ],
    // Edge-to-edge without the OS's translucent strip behind 3-button navigation: the tab bar and the sky run
    // under it, and the root sets the button color from the app's own theme.
    ['expo-navigation-bar', { enforceContrast: false }],
    // Short game sounds only: no microphone and no background playback service.
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false }],
    [
      'expo-font',
      {
        // Embedded as Android font families, so fontFamily + fontWeight picks the real file and text never
        // flashes in a fallback font. Atkinson Hyperlegible is for the grid letters and the word list (plan §7.2).
        android: {
          fonts: [
            {
              fontFamily: 'Figtree',
              fontDefinitions: [
                { path: '../../packages/shared/assets/fonts/Figtree_400Regular.ttf', weight: 400 },
                { path: '../../packages/shared/assets/fonts/Figtree_500Medium.ttf', weight: 500 },
                { path: '../../packages/shared/assets/fonts/Figtree_600SemiBold.ttf', weight: 600 },
                { path: '../../packages/shared/assets/fonts/Figtree_700Bold.ttf', weight: 700 },
              ],
            },
            {
              fontFamily: 'Bricolage',
              fontDefinitions: [
                { path: '../../packages/shared/assets/fonts/BricolageGrotesque_600SemiBold.ttf', weight: 600 },
                { path: '../../packages/shared/assets/fonts/BricolageGrotesque_800ExtraBold.ttf', weight: 800 },
              ],
            },
            {
              fontFamily: 'Atkinson',
              fontDefinitions: [
                { path: './assets/fonts/AtkinsonHyperlegible_400Regular.ttf', weight: 400 },
                { path: './assets/fonts/AtkinsonHyperlegible_700Bold.ttf', weight: 700 },
              ],
            },
          ],
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#EAF6FC',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0D1B2E' },
      },
    ],
    ['expo-build-properties', { android: { compileSdkVersion: 36, targetSdkVersion: 36 } }],
  ],
  experiments: { typedRoutes: true },
  owner: 'tuahaimran',
  extra: { eas: { projectId: '96e829ed-1896-4422-bf1c-6b932abbeb8d' } },
};

export default config;
