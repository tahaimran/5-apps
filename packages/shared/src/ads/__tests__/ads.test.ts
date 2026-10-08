import { resetDisk } from '../../testing/native';
import { adsOf, lastAd, mockAds, mockSdk, resetAds } from '../../testing/adsNative';
import type { AdPolicy, AdUnits } from '../policy';

const UNITS: AdUnits = {
  home: { format: 'banner', unitId: 'real-banner' },
  level_end: { format: 'interstitial', unitId: 'real-interstitial' },
  after_edit: { format: 'interstitial', unitId: 'real-interstitial-2' },
  hint: { format: 'rewarded', unitId: 'real-rewarded' },
  app_open_warm: { format: 'appOpen', unitId: 'real-app-open' },
};

/** Fresh copies of the ads modules (they keep module-level state), on the same fake disk. */
function load() {
  let m!: {
    ads: typeof import('../index');
    state: typeof import('../state');
    consent: typeof import('../../consent');
    full: typeof import('../fullscreen');
  };
  jest.isolateModules(() => {
    m = {
      ads: require('../index'),
      state: require('../state'),
      consent: require('../../consent'),
      full: require('../fullscreen'),
    };
  });
  return m;
}

const NO_CAPS: Partial<AdPolicy> = { firstSessionGraceMs: 0, interstitialMinIntervalMs: 0, interstitialEveryNActions: 1, maxInterstitialsPerSession: 99 };

/** Starts the SDK with consent granted and an interstitial ready to show. */
async function start(m: ReturnType<typeof load>, policy: Partial<AdPolicy> = NO_CAPS, units: AdUnits = UNITS) {
  mockSdk.consent.canRequestAds = true;
  await m.ads.initAds(policy, units);
}
const loadInterstitial = (n = 0) => adsOf('interstitial')[n].emit('loaded');

beforeEach(() => {
  resetDisk();
  resetAds();
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;
  jest.useFakeTimers({ now: 1_000_000, doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => jest.useRealTimers());

describe('policy defaults (docs/ADMOB_PLAYBOOK.md §3)', () => {
  it('match the playbook', () => {
    const { defaultAdPolicy } = require('../policy') as typeof import('../policy');
    expect(defaultAdPolicy).toMatchObject({
      firstSessionGraceMs: 120_000,
      interstitialMinIntervalMs: 90_000,
      interstitialEveryNActions: 2,
      appOpenMinBackgroundMs: 30_000,
      maxInterstitialsPerSession: 6,
      rewardedAlwaysAvailable: true,
    });
  });
});

describe('unit ids', () => {
  const { resolveUnitId } = require('../policy') as typeof import('../policy');
  it('always uses Google test ids in development, even when a real id is configured', () => {
    expect(resolveUnitId({ format: 'banner', unitId: 'ca-app-pub-real/1' })).toBe('test-banner');
    expect(resolveUnitId({ format: 'interstitial' })).toBe('test-interstitial');
    expect(resolveUnitId({ format: 'rewarded' })).toBe('test-rewarded');
    expect(resolveUnitId({ format: 'appOpen' })).toBe('test-app-open');
    expect(resolveUnitId({ format: 'native' })).toBe('test-native');
  });
  it('uses the real id in a release build', () => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    expect(resolveUnitId({ format: 'banner', unitId: 'ca-app-pub-real/1' })).toBe('ca-app-pub-real/1');
  });
  it('shows no ad in a release build when no real id is set (never a test ad)', () => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    expect(resolveUnitId({ format: 'banner' })).toBeNull();
    expect(resolveUnitId({ format: 'banner', unitId: '' })).toBeNull();
    expect(resolveUnitId(undefined)).toBeNull();
  });
});

describe('initAds', () => {
  it('runs consent before the SDK starts', async () => {
    const m = load();
    await start(m);
    expect(mockSdk.consent.gather.mock.invocationCallOrder[0]).toBeLessThan(mockSdk.initialize.mock.invocationCallOrder[0]);
  });
  it('does not start the SDK without consent, and shows nothing', async () => {
    const m = load();
    mockSdk.consent.canRequestAds = false;
    await m.ads.initAds(NO_CAPS, UNITS);
    expect(mockSdk.initialize).not.toHaveBeenCalled();
    expect(mockAds).toHaveLength(0);
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
    expect(await m.ads.showRewarded('hint')).toEqual({ rewarded: false });
  });
  it('starts once consent allows, with the content rating and test devices', async () => {
    const m = load();
    mockSdk.consent.canRequestAds = true;
    await m.ads.initAds({ ...NO_CAPS, testDeviceIds: ['ABC'] }, UNITS);
    expect(mockSdk.setRequestConfiguration).toHaveBeenCalledWith({ maxAdContentRating: 'T', testDeviceIdentifiers: ['ABC'] });
    expect(mockSdk.initialize).toHaveBeenCalledTimes(1);
  });
  it('starts later when the user allows ads in Privacy choices', async () => {
    const m = load();
    mockSdk.consent.canRequestAds = false;
    await m.ads.initAds(NO_CAPS, UNITS);
    expect(mockSdk.initialize).not.toHaveBeenCalled();
    mockSdk.consent.canRequestAds = true;
    await m.consent.openPrivacyOptions();
    await jest.advanceTimersByTimeAsync(0);
    expect(mockSdk.initialize).toHaveBeenCalledTimes(1);
    expect(adsOf('interstitial')).toHaveLength(2); // one per interstitial placement
  });
  it('initializes the SDK exactly once on a normal first launch', async () => {
    // Consent flips to "allowed" while initAds is still waiting, which also fires the change listener.
    const m = load();
    await start(m);
    expect(mockSdk.initialize).toHaveBeenCalledTimes(1);
    expect(mockSdk.setRequestConfiguration).toHaveBeenCalledTimes(1);
    expect(adsOf('interstitial')).toHaveLength(2);
    expect(adsOf('rewarded')).toHaveLength(1);
  });
  it('can start again after a failed initialization', async () => {
    const m = load();
    mockSdk.initialize.mockRejectedValueOnce(new Error('init failed'));
    mockSdk.consent.canRequestAds = true;
    await expect(m.ads.initAds(NO_CAPS, UNITS)).rejects.toThrow('init failed');
    expect(m.state.adsState.ready).toBe(false);
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
    await m.consent.openPrivacyOptions(); // nothing changed, but a later trigger retries
    mockSdk.consent.canRequestAds = false;
    mockSdk.consent.canRequestAds = true;
    await m.ads.initAds(NO_CAPS, UNITS);
    expect(m.state.adsState.ready).toBe(true);
  });
  it('stays off when ads are disabled', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, adsEnabled: false });
    expect(mockSdk.initialize).not.toHaveBeenCalled();
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
  });
  it('does not crash when the consent form fails, and falls back to stored consent', async () => {
    const m = load();
    mockSdk.consent.gatherFails = true;
    mockSdk.consent.canRequestAds = true;
    await expect(m.ads.initAds(NO_CAPS, UNITS)).resolves.toBeUndefined();
    expect(mockSdk.initialize).toHaveBeenCalledTimes(1); // stored consent said yes, started once
  });
  it('stays off when consent cannot be determined at all', async () => {
    const m = load();
    mockSdk.consent.gatherFails = true;
    mockSdk.consent.infoFails = true;
    mockSdk.consent.canRequestAds = true;
    await expect(m.ads.initAds(NO_CAPS, UNITS)).resolves.toBeUndefined();
    expect(mockSdk.initialize).not.toHaveBeenCalled();
  });
  it('preloads each interstitial, the rewarded and the app-open ad', async () => {
    const m = load();
    await start(m);
    expect(adsOf('interstitial').map((a) => a.unitId)).toEqual(['test-interstitial', 'test-interstitial']);
    expect(adsOf('rewarded')).toHaveLength(1);
    expect(adsOf('appOpen')).toHaveLength(1);
    expect(mockAds.every((a) => a.loadCalls === 1)).toBe(true);
  });
  it('does not preload rewarded ads unless asked to', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, rewardedAlwaysAvailable: false });
    expect(adsOf('rewarded')).toHaveLength(0);
  });
  it('asks for no ads in a release build when no real ids are configured', async () => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    const m = load();
    await start(m, NO_CAPS, { level_end: { format: 'interstitial' }, hint: { format: 'rewarded', unitId: 'real' } });
    expect(adsOf('interstitial')).toHaveLength(0);
    expect(adsOf('rewarded').map((a) => a.unitId)).toEqual(['real']);
  });
  it('counts sessions on disk and marks only the first as the first session', async () => {
    let m = load();
    await start(m);
    expect(m.state.adsState.isFirstSession).toBe(true);
    m = load();
    await start(m);
    expect(m.state.adsState.isFirstSession).toBe(false);
  });
  it('counts one session per launch even if initAds is called again', async () => {
    const m = load();
    await start(m);
    await m.ads.initAds(NO_CAPS, UNITS);
    const { sharedStore } = require('../../storage') as typeof import('../../storage');
    expect(sharedStore.get('session.count')).toBe(1);
  });
});

describe('showInterstitial', () => {
  it('shows a preloaded ad, resolves true when it closes, then preloads the next one', async () => {
    const m = load();
    await start(m);
    loadInterstitial();
    const result = m.ads.showInterstitial('level_end');
    await jest.advanceTimersByTimeAsync(0);
    expect(adsOf('interstitial')[0].showCalls).toBe(1);
    adsOf('interstitial')[0].emit('closed');
    expect(await result).toBe(true);
    expect(adsOf('interstitial')).toHaveLength(3); // the reload for level_end
    expect(m.ads.adShownThisSession()).toBe(true);
  });
  it('skips (without blocking) when the ad has not loaded yet', async () => {
    const m = load();
    await start(m);
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
    expect(adsOf('interstitial')[0].showCalls).toBe(0);
  });
  it('retries loading after a failed load the next time it is asked', async () => {
    const m = load();
    await start(m);
    adsOf('interstitial')[0].emit('error');
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
    expect(adsOf('interstitial')).toHaveLength(3);
  });
  it('ignores unknown placements and placements of another format', async () => {
    const m = load();
    await start(m);
    expect(await m.ads.showInterstitial('nope')).toBe(false);
    expect(await m.ads.showInterstitial('hint')).toBe(false);
    expect(await m.ads.showInterstitial('home')).toBe(false);
  });
  it('shows only every Nth call', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, interstitialEveryNActions: 2 });
    loadInterstitial();
    expect(await m.ads.showInterstitial('level_end')).toBe(false); // 1st
    const second = m.ads.showInterstitial('level_end'); // 2nd
    await jest.advanceTimersByTimeAsync(0);
    expect(adsOf('interstitial')[0].showCalls).toBe(1);
    adsOf('interstitial')[0].emit('closed');
    expect(await second).toBe(true);
  });
  it('waits the minimum interval after an ad closed', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, interstitialMinIntervalMs: 90_000 });
    loadInterstitial();
    const first = m.ads.showInterstitial('level_end');
    await jest.advanceTimersByTimeAsync(0);
    adsOf('interstitial')[0].emit('closed');
    await first;
    adsOf('interstitial')[2].emit('loaded');
    jest.advanceTimersByTime(89_000);
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
    jest.advanceTimersByTime(2_000);
    const again = m.ads.showInterstitial('level_end');
    await jest.advanceTimersByTimeAsync(0);
    expect(adsOf('interstitial')[2].showCalls).toBe(1);
    adsOf('interstitial')[2].emit('closed');
    expect(await again).toBe(true);
  });
  it('stops at the per-session maximum', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, maxInterstitialsPerSession: 2 });
    for (let i = 0; i < 2; i++) {
      const ad = lastAd('interstitial');
      const idx = mockAds.indexOf(ad);
      ad.emit('loaded');
      const shown = m.ads.showInterstitial(i === 0 ? 'after_edit' : 'after_edit');
      await jest.advanceTimersByTimeAsync(0);
      mockAds[idx].emit('closed');
      await shown;
    }
    lastAd('interstitial').emit('loaded');
    expect(await m.ads.showInterstitial('after_edit')).toBe(false);
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
  });
  it('does not count an ad that failed to show toward the cap or the interval', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, interstitialMinIntervalMs: 90_000, maxInterstitialsPerSession: 1 });
    adsOf('interstitial')[0].failShow = true;
    loadInterstitial();
    expect(await m.ads.showInterstitial('level_end')).toBe(false);
    expect(m.state.adsState.interstitialsShown).toBe(0);
    expect(m.state.adsState.lastInterstitialAt).toBe(0);
    expect(m.state.adsState.fullScreenActive).toBe(false);
    // the next one is still allowed straight away
    lastAd('interstitial').emit('loaded');
    const again = m.ads.showInterstitial('level_end');
    await jest.advanceTimersByTimeAsync(0);
    lastAd('interstitial');
    expect(adsOf('interstitial').some((a) => a.showCalls === 1 && !a.failShow)).toBe(true);
    adsOf('interstitial').find((a) => a.showCalls === 1 && !a.failShow)!.emit('closed');
    expect(await again).toBe(true);
  });
  it('treats an error while showing as a failure', async () => {
    const m = load();
    await start(m);
    loadInterstitial();
    const result = m.ads.showInterstitial('level_end');
    await jest.advanceTimersByTimeAsync(0);
    adsOf('interstitial')[0].emit('error');
    expect(await result).toBe(false);
    expect(m.state.adsState.fullScreenActive).toBe(false);
    expect(m.ads.adShownThisSession()).toBe(false);
  });
  it('never shows two full-screen ads at once', async () => {
    const m = load();
    await start(m);
    loadInterstitial(0);
    loadInterstitial(1);
    const first = m.ads.showInterstitial('level_end');
    await jest.advanceTimersByTimeAsync(0);
    expect(await m.ads.showInterstitial('after_edit')).toBe(false);
    adsOf('interstitial')[0].emit('closed');
    await first;
  });

  describe('first-session grace', () => {
    it('holds back for the grace period in the first session only', async () => {
      let m = load();
      await start(m, { ...NO_CAPS, firstSessionGraceMs: 120_000 });
      loadInterstitial();
      expect(await m.ads.showInterstitial('level_end')).toBe(false);
      jest.advanceTimersByTime(119_000);
      expect(await m.ads.showInterstitial('level_end')).toBe(false);
      jest.advanceTimersByTime(2_000);
      const shown = m.ads.showInterstitial('level_end');
      await jest.advanceTimersByTimeAsync(0);
      expect(adsOf('interstitial')[0].showCalls).toBe(1);
      adsOf('interstitial')[0].emit('closed');
      expect(await shown).toBe(true);

      // next launch: no grace
      resetAds();
      m = load();
      await start(m, { ...NO_CAPS, firstSessionGraceMs: 120_000 });
      loadInterstitial();
      const second = m.ads.showInterstitial('level_end');
      await jest.advanceTimersByTimeAsync(0);
      expect(adsOf('interstitial')[0].showCalls).toBe(1);
      adsOf('interstitial')[0].emit('closed');
      expect(await second).toBe(true);
    });
  });

  describe('app guard', () => {
    it('can veto, receives the placement, and can be removed', async () => {
      const m = load();
      await start(m);
      loadInterstitial();
      const guard = jest.fn(() => false);
      m.ads.setAdGuard(guard);
      expect(await m.ads.showInterstitial('level_end')).toBe(false);
      expect(guard).toHaveBeenCalledWith('level_end');
      m.ads.setAdGuard(null);
      const shown = m.ads.showInterstitial('level_end');
      await jest.advanceTimersByTimeAsync(0);
      expect(adsOf('interstitial')[0].showCalls).toBe(1);
      adsOf('interstitial')[0].emit('closed');
      expect(await shown).toBe(true);
    });
    it('treats a guard that throws as a veto', async () => {
      const m = load();
      await start(m);
      loadInterstitial();
      m.ads.setAdGuard(() => {
        throw new Error('oops');
      });
      expect(await m.ads.showInterstitial('level_end')).toBe(false);
    });
  });
});

describe('showRewarded', () => {
  const rewarded = () => adsOf('rewarded')[0];

  it('grants the reward only when it was earned', async () => {
    const m = load();
    await start(m);
    rewarded().emit('rewarded_loaded');
    const result = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(0);
    expect(rewarded().showCalls).toBe(1);
    rewarded().emit('rewarded_earned_reward', { amount: 1 });
    rewarded().emit('closed');
    expect(await result).toEqual({ rewarded: true });
  });
  it('gives nothing when the user closes it early', async () => {
    const m = load();
    await start(m);
    rewarded().emit('rewarded_loaded');
    const result = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(0);
    rewarded().emit('closed');
    expect(await result).toEqual({ rewarded: false });
  });
  it('does not carry a reward over to the next ad', async () => {
    const m = load();
    await start(m);
    rewarded().emit('rewarded_loaded');
    const first = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(0);
    rewarded().emit('rewarded_earned_reward');
    rewarded().emit('closed');
    await first;
    adsOf('rewarded')[1].emit('rewarded_loaded');
    const second = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(0);
    adsOf('rewarded')[1].emit('closed');
    expect(await second).toEqual({ rewarded: false });
  });
  it('preloads the next one after showing', async () => {
    const m = load();
    await start(m);
    rewarded().emit('rewarded_loaded');
    const result = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(0);
    rewarded().emit('closed');
    await result;
    expect(adsOf('rewarded')).toHaveLength(2);
  });
  it('waits up to six seconds for an ad that is still loading', async () => {
    const m = load();
    await start(m);
    const result = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(1_000);
    expect(rewarded().showCalls).toBe(0);
    rewarded().emit('rewarded_loaded');
    await jest.advanceTimersByTimeAsync(300);
    expect(rewarded().showCalls).toBe(1);
    rewarded().emit('rewarded_earned_reward');
    rewarded().emit('closed');
    expect(await result).toEqual({ rewarded: true });
  });
  it('gives up after six seconds', async () => {
    const m = load();
    await start(m);
    const result = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(6_500);
    expect(await result).toEqual({ rewarded: false });
    expect(rewarded().showCalls).toBe(0);
  });
  it('gives up at once when loading fails', async () => {
    const m = load();
    await start(m);
    const result = m.ads.showRewarded('hint');
    rewarded().emit('error');
    await jest.advanceTimersByTimeAsync(200);
    expect(await result).toEqual({ rewarded: false });
  });
  it('returns false when the ad fails to show', async () => {
    const m = load();
    await start(m);
    rewarded().failShow = true;
    rewarded().emit('rewarded_loaded');
    expect(await m.ads.showRewarded('hint')).toEqual({ rewarded: false });
    expect(m.state.adsState.fullScreenActive).toBe(false);
  });
  it('ignores caps, the first-session grace and the app guard (the user asked for it)', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, firstSessionGraceMs: 999_999, maxInterstitialsPerSession: 0, interstitialMinIntervalMs: 999_999 });
    m.ads.setAdGuard(() => false);
    rewarded().emit('rewarded_loaded');
    const result = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(0);
    expect(rewarded().showCalls).toBe(1);
    rewarded().emit('rewarded_earned_reward');
    rewarded().emit('closed');
    expect(await result).toEqual({ rewarded: true });
  });
  it('is unavailable without consent, for unknown placements and during another full-screen ad', async () => {
    const m = load();
    mockSdk.consent.canRequestAds = false;
    await m.ads.initAds(NO_CAPS, UNITS);
    expect(await m.ads.showRewarded('hint')).toEqual({ rewarded: false });
    const m2 = load();
    await start(m2);
    expect(await m2.ads.showRewarded('nope')).toEqual({ rewarded: false });
    expect(await m2.ads.showRewarded('level_end')).toEqual({ rewarded: false });
  });
  it('reports readiness for the button state', async () => {
    const m = load();
    await start(m);
    expect(m.ads.isRewardedReady('hint')).toBe(false);
    rewarded().emit('rewarded_loaded');
    expect(m.ads.isRewardedReady('hint')).toBe(true);
    const result = m.ads.showRewarded('hint');
    await jest.advanceTimersByTimeAsync(0);
    expect(m.ads.isRewardedReady('hint')).toBe(false);
    rewarded().emit('closed');
    await result;
  });
});

describe('maybeShowAppOpen', () => {
  const appOpen = () => adsOf('appOpen')[0];
  it('shows a loaded ad and preloads the next', async () => {
    const m = load();
    await start(m);
    appOpen().emit('loaded');
    const result = m.full.maybeShowAppOpen();
    await jest.advanceTimersByTimeAsync(0);
    expect(appOpen().showCalls).toBe(1);
    appOpen().emit('closed');
    expect(await result).toBe(true);
    expect(adsOf('appOpen')).toHaveLength(2);
  });
  it('does nothing when no ad is ready yet (and starts loading)', async () => {
    const m = load();
    await start(m);
    expect(await m.full.maybeShowAppOpen()).toBe(false);
    expect(appOpen().showCalls).toBe(0);
  });
  it('respects the guard under the name app_open, and the first-session grace', async () => {
    const m = load();
    await start(m, { ...NO_CAPS, firstSessionGraceMs: 60_000 });
    appOpen().emit('loaded');
    expect(await m.full.maybeShowAppOpen()).toBe(false); // grace
    jest.advanceTimersByTime(61_000);
    const guard = jest.fn(() => false);
    m.ads.setAdGuard(guard);
    expect(await m.full.maybeShowAppOpen()).toBe(false);
    expect(guard).toHaveBeenCalledWith('app_open');
  });
  it('retries loading after a failed load, without showing anything', async () => {
    const m = load();
    await start(m);
    appOpen().emit('error');
    expect(await m.full.maybeShowAppOpen()).toBe(false);
    expect(adsOf('appOpen')).toHaveLength(2);
    expect(adsOf('appOpen').every((a) => a.showCalls === 0)).toBe(true);
  });
  it('is not shown while an interstitial is open', async () => {
    const m = load();
    await start(m);
    loadInterstitial();
    appOpen().emit('loaded');
    const inter = m.ads.showInterstitial('level_end');
    await jest.advanceTimersByTimeAsync(0);
    expect(await m.full.maybeShowAppOpen()).toBe(false);
    adsOf('interstitial')[0].emit('closed');
    await inter;
  });
  it('counts toward "an ad was shown this session"', async () => {
    const m = load();
    await start(m);
    expect(m.ads.adShownThisSession()).toBe(false);
    appOpen().emit('loaded');
    const result = m.full.maybeShowAppOpen();
    await jest.advanceTimersByTimeAsync(0);
    appOpen().emit('closed');
    await result;
    expect(m.ads.adShownThisSession()).toBe(true);
  });
});
