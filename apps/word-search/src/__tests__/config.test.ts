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
  const exists = (rel: string) => require('fs').existsSync(require('path').resolve(__dirname, '../..', rel));
  it('configures expo-audio with no microphone, no recording and no background playback', () => {
    expect(pluginOptions('expo-audio')![1]).toEqual({ microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false });
  });
  it('plays the shared sounds (a chime for a found word, an arpeggio for a finished puzzle)', () => {
    for (const f of ['check.wav', 'complete.wav']) expect(exists(`../../packages/shared/assets/sounds/${f}`)).toBe(true);
    expect(exists('assets/sounds')).toBe(false);
  });
  it('bundles the reminder chime and a white notification icon in the brand color', () => {
    const notifications = pluginOptions('expo-notifications')![1] as { icon: string; color: string; sounds: string[] };
    expect(notifications.color).toBe('#1F5FAF');
    expect(exists(notifications.icon)).toBe(true);
    expect(notifications.sounds.map((s) => require('path').basename(s))).toEqual(['reminder.wav']);
    for (const s of notifications.sounds) expect(exists(s)).toBe(true);
  });
  it('embeds Figtree, Bricolage and Atkinson Hyperlegible with the expo-font plugin (no runtime font loading)', () => {
    const font = pluginOptions('expo-font')![1] as { android: { fonts: { fontFamily: string; fontDefinitions: { path: string; weight: number }[] }[] } };
    const families = Object.fromEntries(font.android.fonts.map((f) => [f.fontFamily, f.fontDefinitions]));
    expect(Object.keys(families).sort()).toEqual(['Atkinson', 'Bricolage', 'Figtree']);
    expect(families.Atkinson.map((d) => d.weight)).toEqual([400, 700]);
    for (const defs of Object.values(families)) for (const d of defs) expect(exists(d.path)).toBe(true);
    const pkg = require('../../package.json') as { dependencies: Record<string, string> };
    expect(pkg.dependencies).not.toHaveProperty('@expo-google-fonts/atkinson-hyperlegible');
    expect(pkg.dependencies).not.toHaveProperty('@expo/vector-icons');
  });
  it('has the native pieces of the redesign in one dev build', () => {
    const pkg = require('../../package.json') as { dependencies: Record<string, string> };
    for (const dep of ['expo-dev-client', 'expo-linear-gradient', 'expo-navigation-bar', 'lucide-react-native']) expect(pkg.dependencies).toHaveProperty(dep);
    expect(plugins).toContain('expo-navigation-bar');
    expect(config.android?.adaptiveIcon?.backgroundImage).toBeTruthy();
    expect(exists(config.android!.adaptiveIcon!.backgroundImage!)).toBe(true);
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
