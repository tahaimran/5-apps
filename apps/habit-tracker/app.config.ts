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
      'android.permission.RECORD_AUDIO',
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
        color: '#5B3DF5',
        // Bundled into res/raw; channels refer to them by file name (see src/notifications/scheduler.ts).
        sounds: ['../../packages/shared/assets/sounds/reminder.wav'],
      },
    ],
    // Edge-to-edge without the OS's translucent strip behind 3-button navigation: the tab bar and
    // screen colors run under it, and the root sets the button color from the app's own theme.
    ['expo-navigation-bar', { enforceContrast: false }],
    // Short UI sounds only: no microphone and no background playback service.
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false }],
    [
      'expo-font',
      {
        // Embedded as Android font families, so fontFamily 'Figtree' + fontWeight picks the real file
        // and text never flashes in a fallback font.
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
          ],
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#F6F5FA',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#100E17' },
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
  owner: 'tuahaimran',
  extra: { eas: { projectId: 'c075f72a-bd98-4450-be12-e90186e6f64d' } },
};

export default config;
