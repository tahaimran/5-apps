import '@/testing/mocks';
/** Permissions review, target API level and store-facing config. */
import config from '../../app.config';

const permissions = config.android?.permissions ?? [];
const blocked = config.android?.blockedPermissions ?? [];
const plugins = (config.plugins ?? []).map((p) => (Array.isArray(p) ? p[0] : p));
const pluginOptions = (name: string) => (config.plugins ?? []).find((p) => Array.isArray(p) && p[0] === name) as [string, Record<string, unknown>] | undefined;

describe('Android permissions', () => {
  it('declares only what the built features need', () => {
    expect([...permissions].sort()).toEqual(['POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'com.google.android.gms.permission.AD_ID'].sort());
  });
  it('blocks exact alarms, battery-optimization prompts, storage and overlays that libraries could add', () => {
    for (const p of [
      'SCHEDULE_EXACT_ALARM',
      'USE_EXACT_ALARM',
      'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'SYSTEM_ALERT_WINDOW',
    ]) {
      expect(blocked).toContain(`android.permission.${p}`);
    }
  });
  it('does not both request and block the same permission', () => {
    for (const p of permissions) expect(blocked).not.toContain(p.includes('.') ? p : `android.permission.${p}`);
  });
});

describe('store-facing config', () => {
  it('has the listing identity from the plan', () => {
    expect(config).toMatchObject({ name: 'Word Search', slug: 'word-search', scheme: 'wordsearch' });
    expect(config.platforms).toEqual(['android']);
  });
  it('uses the package the cross-promo catalog links to', () => {
    const { promoPackages } = require('@shared/crosspromo/catalog');
    expect(config.android?.package).toBe(promoPackages['word-search']);
  });
  it('targets a current Android API level', () => {
    const build = pluginOptions('expo-build-properties')![1] as { android: { targetSdkVersion: number; compileSdkVersion: number } };
    expect(build.android.targetSdkVersion).toBeGreaterThanOrEqual(35);
    expect(build.android.compileSdkVersion).toBeGreaterThanOrEqual(build.android.targetSdkVersion);
  });
  it('registers the native plugins the built features need', () => {
    for (const name of ['expo-router', 'react-native-google-mobile-ads', 'expo-notifications', 'expo-audio', 'expo-splash-screen']) expect(plugins).toContain(name);
  });
  it('uses a test AdMob app id until a real one is set in EAS', () => {
    const ads = pluginOptions('react-native-google-mobile-ads')![1] as { androidAppId: string };
    expect(ads.androidAppId).toMatch(/^ca-app-pub-\d+~\d+$/);
    if (!process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID) expect(ads.androidAppId).toBe('ca-app-pub-3940256099942544~3347511713');
  });
  it('has the icon set, with the adaptive layers in files that exist', () => {
    for (const file of [config.icon, config.android?.adaptiveIcon?.foregroundImage, config.android?.adaptiveIcon?.monochromeImage]) {
      if (!file) continue;
      expect(require('fs').existsSync(require('path').resolve(__dirname, '../..', file))).toBe(true);
    }
    expect(config.icon).toBeTruthy();
    expect(config.android?.adaptiveIcon?.foregroundImage).toBeTruthy();
  });
});

describe('audio and reminder config', () => {
  it('asks for no microphone permission for the two game sounds', () => {
    const audio = pluginOptions('expo-audio')![1] as { microphonePermission: boolean };
    expect(audio.microphonePermission).toBe(false);
  });
  it('bundles the two sounds', () => {
    for (const f of ['found.wav', 'complete.wav']) expect(require('fs').existsSync(require('path').resolve(__dirname, '../../assets/sounds', f))).toBe(true);
  });
  it('blocks the microphone and foreground-service permissions the audio library adds on its own', () => {
    for (const p of ['RECORD_AUDIO', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_MEDIA_PLAYBACK']) expect(blocked).toContain(`android.permission.${p}`);
  });
  it('uses no exact alarms: the reminder is an ordinary scheduled notification', () => {
    expect(permissions).not.toContain('SCHEDULE_EXACT_ALARM');
    expect(blocked).toContain('android.permission.SCHEDULE_EXACT_ALARM');
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
    const fs = require('fs');
    const path = require('path');
    const files = ['../ads.config.ts', '../../.env.example', '../../app.config.ts'];
    for (const f of files) {
      const src = fs.readFileSync(path.resolve(__dirname, f), 'utf8') as string;
      expect(src.replace('ca-app-pub-3940256099942544~3347511713', '')).not.toMatch(/ca-app-pub-\d+[/~]\d+/);
    }
  });
  it('keeps the env example in step with the placements', () => {
    const fs = require('fs');
    const path = require('path');
    const env = fs.readFileSync(path.resolve(__dirname, '../../.env.example'), 'utf8') as string;
    const { adUnits } = require('@/ads.config');
    for (const placement of Object.keys(adUnits)) expect(env).toContain(`EXPO_PUBLIC_ADMOB_${placement.toUpperCase()}=`);
  });
});
