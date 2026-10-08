/** Checklist §18 "Permissions review", target API level and store-facing config. */
import config from '../../app.config';

const permissions = config.android?.permissions ?? [];
const blocked = config.android?.blockedPermissions ?? [];
const plugins = (config.plugins ?? []).map((p) => (Array.isArray(p) ? p[0] : p));
const pluginOptions = (name: string) => (config.plugins ?? []).find((p) => Array.isArray(p) && p[0] === name) as [string, Record<string, unknown>] | undefined;

describe('Android permissions', () => {
  it('declares only what the plan allows', () => {
    expect([...permissions].sort()).toEqual(
      ['POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'com.google.android.gms.permission.AD_ID'].sort(),
    );
  });
  it('blocks storage, overlay and exact-alarm permissions that libraries could add', () => {
    for (const p of ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'SYSTEM_ALERT_WINDOW', 'SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM']) {
      expect(blocked).toContain(`android.permission.${p}`);
    }
  });
  it('does not both request and block the same permission', () => {
    for (const p of permissions) expect(blocked).not.toContain(p.includes('.') ? p : `android.permission.${p}`);
  });
});

describe('store-facing config', () => {
  it('has the listing identity from the plan', () => {
    expect(config).toMatchObject({ name: 'Habits', slug: 'habit-tracker', scheme: 'habittracker' });
    expect(config.android?.package).toBe('com.fiveapps.habittracker');
    expect(config.platforms).toEqual(['android']);
  });
  it('targets a current Android API level', () => {
    const build = pluginOptions('expo-build-properties')![1] as { android: { targetSdkVersion: number; compileSdkVersion: number } };
    expect(build.android.targetSdkVersion).toBeGreaterThanOrEqual(35);
    expect(build.android.compileSdkVersion).toBeGreaterThanOrEqual(build.android.targetSdkVersion);
  });
  it('registers the native plugins the features need', () => {
    for (const name of ['expo-router', 'react-native-google-mobile-ads', 'expo-notifications', 'react-native-android-widget', 'expo-splash-screen']) {
      expect(plugins).toContain(name);
    }
  });
  it('uses a test AdMob app id until a real one is set in EAS', () => {
    const ads = pluginOptions('react-native-google-mobile-ads')![1] as { androidAppId: string };
    expect(ads.androidAppId).toMatch(/^ca-app-pub-\d+~\d+$/);
    if (!process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID) expect(ads.androidAppId).toBe('ca-app-pub-3940256099942544~3347511713');
  });
  it('has the icon set, with the adaptive layers in the safe zone files that exist', () => {
    for (const file of [config.icon, config.android?.adaptiveIcon?.foregroundImage, config.android?.adaptiveIcon?.monochromeImage]) {
      expect(file).toBeTruthy();
      expect(require('fs').existsSync(require('path').resolve(__dirname, '../..', file as string))).toBe(true);
    }
  });
  it('has a widget with a 4x2 default size', () => {
    const widgets = (pluginOptions('react-native-android-widget')![1] as { widgets: { name: string; targetCellWidth: number; targetCellHeight: number }[] }).widgets;
    expect(widgets[0]).toMatchObject({ name: 'TodayWidget', targetCellWidth: 4, targetCellHeight: 2 });
  });
});

describe('release config', () => {
  it('builds an AAB for production and an APK dev client', () => {
    const eas = require('../../eas.json');
    expect(eas.build.production.android.buildType).toBe('app-bundle');
    expect(eas.build.development).toMatchObject({ developmentClient: true });
    expect(eas.submit.production.android.track).toBe('internal');
  });
  it('never commits a real AdMob id', () => {
    const src = require('fs').readFileSync(require('path').resolve(__dirname, '../ads.config.ts'), 'utf8') as string;
    expect(src).not.toMatch(/ca-app-pub-\d+\/\d+/);
    expect(src).not.toMatch(/ca-app-pub-\d+~\d+/);
  });
});
