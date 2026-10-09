import '@/testing/mocks';
/** Permissions review, target API level and store-facing config. */
import config from '../../app.config';

const permissions = config.android?.permissions ?? [];
const blocked = config.android?.blockedPermissions ?? [];
const plugins = (config.plugins ?? []).map((p) => (Array.isArray(p) ? p[0] : p));
const pluginOptions = (name: string) => (config.plugins ?? []).find((p) => Array.isArray(p) && p[0] === name) as [string, Record<string, unknown>] | undefined;

describe('Android permissions', () => {
  it('declares only what the built features need', () => {
    // POST_NOTIFICATIONS (the optional kick reminder), VIBRATE (haptics), AD_ID (AdMob).
    expect([...permissions].sort()).toEqual(['POST_NOTIFICATIONS', 'VIBRATE', 'com.google.android.gms.permission.AD_ID'].sort());
  });
  it('blocks exact alarms, battery-optimization prompts, storage and overlays that libraries could add', () => {
    // expo-file-system's own manifest asks for READ/WRITE_EXTERNAL_STORAGE; the app needs neither (PDFs go to the cache).
    for (const p of ['SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM', 'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'SYSTEM_ALERT_WINDOW']) {
      expect(blocked).toContain(`android.permission.${p}`);
    }
  });
  it('does not both request and block the same permission', () => {
    for (const p of permissions) expect(blocked).not.toContain(p.includes('.') ? p : `android.permission.${p}`);
  });
  it('asks for no microphone, camera, location or contacts', () => {
    const all = permissions.join(' ');
    for (const word of ['RECORD_AUDIO', 'CAMERA', 'LOCATION', 'CONTACTS', 'SMS', 'PHONE']) expect(all).not.toContain(word);
  });
  it('uses no exact alarms: the kick reminder is an ordinary daily notification', () => {
    expect(permissions).not.toContain('SCHEDULE_EXACT_ALARM');
    expect(blocked).toContain('android.permission.SCHEDULE_EXACT_ALARM');
  });
});

describe('store-facing config', () => {
  it('has the listing identity from the plan', () => {
    expect(config).toMatchObject({ name: 'Contraction Timer', slug: 'contraction-timer', scheme: 'contractiontimer' });
    expect(config.platforms).toEqual(['android']);
  });
  it('uses the package the cross-promo catalog links to', () => {
    const { promoPackages } = require('@shared/crosspromo/catalog');
    expect(config.android?.package).toBe(promoPackages['contraction-timer']);
  });
  it('targets a current Android API level', () => {
    const build = pluginOptions('expo-build-properties')![1] as { android: { targetSdkVersion: number; compileSdkVersion: number } };
    expect(build.android.targetSdkVersion).toBeGreaterThanOrEqual(35);
    expect(build.android.compileSdkVersion).toBeGreaterThanOrEqual(build.android.targetSdkVersion);
  });
  it('registers the native plugins the built features need', () => {
    for (const name of ['expo-router', 'react-native-google-mobile-ads', 'expo-notifications', 'expo-sharing', 'expo-splash-screen']) expect(plugins).toContain(name);
  });
  it('has no audio plugin: the app plays no sounds, so it cannot pick up the microphone permission that library adds', () => {
    expect(plugins).not.toContain('expo-audio');
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
  it('sets the splash colors to the cream and dark backgrounds, not white', () => {
    const splash = pluginOptions('expo-splash-screen')![1] as { backgroundColor: string; dark: { backgroundColor: string } };
    expect(splash.backgroundColor).toBe('#FBF7F4');
    expect(splash.dark.backgroundColor).toBe('#141519');
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
    for (const f of ['../ads.config.ts', '../../.env.example', '../../app.config.ts']) {
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
  it('uses the placement ids of plan §12', () => {
    const { adUnits } = require('@/ads.config');
    expect(Object.keys(adUnits).sort()).toEqual(
      ['app_open', 'checklist_banner', 'checklist_template_reward', 'history_banner', 'pdf_theme_reward', 'week_banner', 'week_close_interstitial', 'week_native'].sort(),
    );
  });
  it('asks for the plan\'s maximum ad content rating (G) and a 3-minute interstitial gap', () => {
    const { adPolicy } = require('@/ads.config');
    expect(adPolicy.maxAdContentRating).toBe('G');
    expect(adPolicy.interstitialMinIntervalMs).toBe(180_000);
    expect(adPolicy.appOpenMinBackgroundMs).toBe(4 * 3_600_000);
  });
});
