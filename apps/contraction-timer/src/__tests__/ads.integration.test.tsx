/**
 * The ad rules of plan §12 against the real @shared/ads layer with a fake AdMob SDK: consent before the SDK, banners only where
 * allowed, nothing at all while a session or kick count is open, the one interstitial, rewarded unlocks and the app-open ad.
 * Nothing here talks to Google; it shows the wiring is right. It does not replace a device.
 */
import '@/testing/mocks';
import { adsOf, mockSdk, resetAds } from '@shared/testing/adsNative';
import { mockParams, mockPath } from '@/testing/mocks';
import { resetApp, seedSession } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { AppState } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { adsState } from '@shared/ads/state';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { installAdGuard } from '@/ads/guard';
import { resetAdsStart, startAds } from '@/ads/start';
import { adPolicy, adUnits } from '@/ads.config';
import { useAds } from '@/store/ads';
import { useChecklists } from '@/store/checklists';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { useUnlocks } from '@/store/unlocks';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import RootLayout from '../../app/_layout';
import Kicks from '../../app/(tabs)/kicks/index';
import KickHistory from '../../app/(tabs)/kicks/history';
import TimerHistory from '../../app/(tabs)/timer/history';
import TimerScreen from '../../app/(tabs)/timer/index';
import SessionDetail from '../../app/(tabs)/timer/session/[id]';
import Pregnancy from '../../app/(tabs)/pregnancy/index';
import Week from '../../app/(tabs)/pregnancy/week/[n]';
import HospitalBag from '../../app/(tabs)/pregnancy/hospital-bag';
import BirthPlan from '../../app/(tabs)/pregnancy/birth-plan';
import PdfTheme from '../../app/modals/pdf-theme';
import DebugAds from '../../app/debug-ads';
import Onboarding from '../../app/onboarding';

const wrap = (el: React.ReactElement) => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
    {el}
  </ThemeProvider>
);
// 10 Nov 2026, noon. The app was installed on 1 Nov (9 days ago) and has been opened 9 times.
const NOW = new Date(2026, 10, 10, 12, 0).getTime();
const DAY = 86_400_000;
let removeGuard: () => void;

const bannersOf = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => (n.type as unknown) === 'BannerAd');
const nativeOf = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => (n.type as unknown) === 'NativeAdView');

/** A person who is past onboarding, has acknowledged the disclaimer, and has used the app for 9 days. */
function seasoned() {
  sharedStore.set('onboarding.completedAt', 1);
  useMeta.getState().update({ disclaimerAckAt: 1, installAt: NOW - 9 * DAY, launches: 9 });
}

/** Show counts at the start of each test: the fake ads live for the whole file. */
const baseline = new Map<unknown, number>();
function snapshot() {
  baseline.clear();
  for (const kind of ['interstitial', 'rewarded', 'appOpen'] as const) for (const ad of adsOf(kind)) baseline.set(ad, ad.showCalls);
}
const shown = (kind: 'interstitial' | 'rewarded' | 'appOpen') => adsOf(kind).filter((a) => a.showCalls > (baseline.get(a) ?? 0));

/** Everything the shared layer remembers between tests, back to a fresh launch with all ads loaded. */
function freshAds() {
  Object.assign(adsState, { interstitialsShown: 0, lastInterstitialAt: 0, interstitialActions: 0, fullScreenActive: false, fullScreenShown: 0, isFirstSession: false });
  for (const kind of ['interstitial', 'rewarded', 'appOpen'] as const) for (const ad of adsOf(kind)) ad.emit(kind === 'rewarded' ? 'rewarded_loaded' : 'loaded');
}

const startup = { gatherCalls: 0, gatherBeforeInit: false, initCalls: 0, config: null as unknown, ids: {} as Record<string, string[]> };

beforeAll(async () => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetAds();
  mockSdk.consent.canRequestAds = true;
  removeGuard = installAdGuard();
  resetApp(new Date(NOW));
  seasoned();
  await startAds();
  startup.gatherCalls = mockSdk.consent.gather.mock.calls.length;
  startup.gatherBeforeInit = mockSdk.consent.gather.mock.invocationCallOrder[0] < mockSdk.initialize.mock.invocationCallOrder[0];
  startup.initCalls = mockSdk.initialize.mock.calls.length;
  startup.config = mockSdk.setRequestConfiguration.mock.calls[0]?.[0];
  for (const kind of ['interstitial', 'rewarded', 'appOpen'] as const) startup.ids[kind] = adsOf(kind).map((a) => a.unitId);
});
afterAll(() => {
  removeGuard();
  jest.useRealTimers();
});
beforeEach(() => {
  jest.setSystemTime(NOW);
  resetApp(new Date(NOW));
  useAds.getState().reset();
  seasoned();
  mockPath.current = '/more';
  jest.clearAllMocks();
  snapshot();
  freshAds();
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('onboarding.completedAt');
  mockSdk.native.current = { status: 'idle', nativeAd: null, error: null };
});

describe('consent and start-up (plan §6, F20)', () => {
  it('asks for consent before the SDK starts, and starts it once', () => {
    expect(startup.gatherCalls).toBe(1);
    expect(startup.gatherBeforeInit).toBe(true);
    expect(startup.initCalls).toBe(1);
  });
  it('asks for nothing at all, not even consent, before the disclaimer is acknowledged', async () => {
    resetAdsStart();
    useMeta.getState().update({ disclaimerAckAt: undefined });
    const before = mockSdk.consent.gather.mock.calls.length;
    await startAds();
    expect(mockSdk.consent.gather.mock.calls.length).toBe(before);
  });
  it("limits ads to rating G (plan §12: maximum ad content rating G) and is not child-directed", () => {
    expect(startup.config).toEqual(expect.objectContaining({ maxAdContentRating: 'G' }));
    expect(JSON.stringify(startup.config)).not.toMatch(/tagForChildDirectedTreatment|tagForUnderAgeOfConsent":true/);
  });
  it('preloads the interstitial, the rewarded unlocks and the app-open ad with Google test ids', () => {
    expect(startup.ids.interstitial).toEqual(['test-interstitial']);
    expect(startup.ids.rewarded).toEqual(['test-rewarded', 'test-rewarded']);
    expect(startup.ids.appOpen).toEqual(['test-app-open']);
  });
  it('uses the placements of the plan and its gaps', () => {
    expect(Object.keys(adUnits).sort()).toEqual(['app_open', 'checklist_banner', 'checklist_template_reward', 'history_banner', 'pdf_theme_reward', 'week_banner', 'week_close_interstitial', 'week_native']);
    expect(adPolicy).toMatchObject({ interstitialMinIntervalMs: 180_000, appOpenMinBackgroundMs: 4 * 3_600_000, firstSessionGraceMs: 0 });
  });
});

describe('banners (plan §12)', () => {
  it('shows one on the contraction history and one on the kick history, when no session is open', async () => {
    for (const screen of [<TimerHistory />, <KickHistory />]) {
      const ui = await render(wrap(screen));
      await flush();
      expect(bannersOf(ui)).toHaveLength(1);
      expect(bannersOf(ui)[0].props.unitId).toBe('test-banner');
      await cleanup();
    }
  });

  it('shows one under the week list, under a week article and under each checklist', async () => {
    mockParams.current = { n: '20' };
    for (const screen of [<Pregnancy />, <Week />, <HospitalBag />, <BirthPlan />]) {
      const ui = await render(wrap(screen));
      await flush();
      expect(bannersOf(ui)).toHaveLength(1);
      await cleanup();
    }
  });

  it('shows none on the Timer, the Kicks tab, a session detail or onboarding', async () => {
    const s = seedSession('s1', 3_600_000, 4, {}, NOW);
    mockParams.current = { id: s.id };
    for (const screen of [<TimerScreen />, <Kicks />, <SessionDetail />, <Onboarding />]) {
      const ui = await render(wrap(screen));
      await flush();
      expect(bannersOf(ui)).toHaveLength(0);
      expect(nativeOf(ui)).toHaveLength(0);
      await cleanup();
    }
  });

  it('shows none while a contraction session is open, even if it is resting between contractions', async () => {
    useSessions.getState().tap(NOW - 20 * 60_000);
    useSessions.getState().tap(NOW - 19 * 60_000);
    for (const screen of [<TimerHistory />, <KickHistory />, <Pregnancy />, <HospitalBag />]) {
      const ui = await render(wrap(screen));
      await flush();
      expect(bannersOf(ui)).toHaveLength(0);
      await cleanup();
    }
  });

  it('shows none while a kick count is open', async () => {
    useKicks.getState().start(NOW - 60_000);
    const ui = await render(wrap(<KickHistory />));
    await flush();
    expect(bannersOf(ui)).toHaveLength(0);
  });

  it('takes a banner away the moment a session opens under it', async () => {
    const ui = await render(wrap(<TimerHistory />));
    await flush();
    expect(bannersOf(ui)).toHaveLength(1);
    await act(async () => void useSessions.getState().tap(NOW));
    expect(bannersOf(ui)).toHaveLength(0);
  });

  it('hides the checklist banner while the keyboard is open', async () => {
    const ui = await render(wrap(<HospitalBag />));
    await flush();
    expect(bannersOf(ui)).toHaveLength(1);
    await act(async () => useAds.getState().setKeyboard(true));
    expect(bannersOf(ui)).toHaveLength(0);
    await act(async () => useAds.getState().setKeyboard(false));
    expect(bannersOf(ui)).toHaveLength(1);
  });

  it('shows none before onboarding is finished or the disclaimer acknowledged', async () => {
    useMeta.getState().update({ disclaimerAckAt: undefined });
    const ui = await render(wrap(<TimerHistory />));
    await flush();
    expect(bannersOf(ui)).toHaveLength(0);
  });

  it('leaves no blank slot when no ad is available', async () => {
    adsState.ready = false;
    try {
      const ui = await render(wrap(<TimerHistory />));
      await flush();
      expect(bannersOf(ui)).toHaveLength(0);
    } finally {
      adsState.ready = true;
    }
  });
});

describe('the native card in the week list (plan §12)', () => {
  const loaded = { status: 'loaded', nativeAd: { headline: 'A thing', body: 'Body', callToAction: 'Open' } };

  it('comes after the 3rd card, with the "Ad" label, and only once in the first screenful', async () => {
    mockSdk.native.current = loaded;
    const ui = await render(wrap(<Pregnancy />));
    await flush();
    expect(nativeOf(ui)).toHaveLength(1);
    expect(ui.texts()).toContain('Ad');
    const order = ui.root.findAll((n) => typeof n.type === 'string' && ((typeof n.props.accessibilityLabel === 'string' && /^Week \d+/.test(n.props.accessibilityLabel)) || (n.type as string) === 'NativeAdView'));
    const positions = order.map((n) => ((n.type as string) === 'NativeAdView' ? 'ad' : 'card'));
    expect(positions.indexOf('ad')).toBe(3);
  });

  it('never shows while a session is open', async () => {
    mockSdk.native.current = loaded;
    useSessions.getState().tap(NOW);
    const ui = await render(wrap(<Pregnancy />));
    await flush();
    expect(nativeOf(ui)).toHaveLength(0);
  });
});

describe('the one interstitial: closing a week article (plan §12)', () => {
  const read = async (seconds: number) => {
    mockParams.current = { n: '20' };
    const ui = await render(wrap(<Week />));
    await flush();
    await act(async () => {
      jest.setSystemTime(Date.now() + seconds * 1000);
      jest.advanceTimersByTime(seconds * 1000);
    });
    await cleanup(); // Back
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    void ui;
  };
  const closeAd = async () => act(async () => shown('interstitial')[0].emit('closed'));

  it('shows after a 25-second read', async () => {
    await read(25);
    expect(shown('interstitial')).toHaveLength(1);
  });
  it('does not show after a 10-second read', async () => {
    await read(10);
    expect(shown('interstitial')).toHaveLength(0);
  });
  it('does not show on the day of install, or on the first launch, or in Partner mode', async () => {
    useMeta.getState().update({ installAt: NOW - 3 * 3_600_000 });
    await read(25);
    expect(shown('interstitial')).toHaveLength(0);
    useMeta.getState().update({ installAt: NOW - 9 * DAY, launches: 1 });
    await read(25);
    expect(shown('interstitial')).toHaveLength(0);
    useMeta.getState().update({ launches: 9 });
    useSettings.getState().update({ partnerMode: true });
    await read(25);
    expect(shown('interstitial')).toHaveLength(0);
  });
  it('does not show with a session or a kick count open, or within 2 minutes of a session ending', async () => {
    useSessions.getState().tap(NOW - 60_000);
    await read(25);
    expect(shown('interstitial')).toHaveLength(0);
    useSessions.getState().reset();
    useKicks.getState().start(NOW - 60_000);
    await read(25);
    expect(shown('interstitial')).toHaveLength(0);
    useKicks.getState().reset();
    useMeta.getState().update({ lastSessionEndedAt: Date.now() - 60_000 });
    await read(25);
    expect(shown('interstitial')).toHaveLength(0);
  });
  it('waits 3 minutes after an ad, and shows at most 4 a day', async () => {
    await read(25);
    await closeAd();
    expect(useAds.getState().state.interstitialsToday).toBe(1);
    freshAds();
    snapshot();
    await read(25); // the read itself is 25 s, far under 3 minutes after the ad
    expect(shown('interstitial')).toHaveLength(0);
    // three more, each more than 3 minutes apart
    for (let i = 0; i < 3; i++) {
      jest.setSystemTime(Date.now() + 4 * 60_000);
      freshAds();
      snapshot();
      await read(25);
      expect(shown('interstitial')).toHaveLength(1);
      await closeAd();
    }
    expect(useAds.getState().state.interstitialsToday).toBe(4);
    jest.setSystemTime(Date.now() + 4 * 60_000);
    freshAds();
    snapshot();
    await read(25);
    expect(shown('interstitial')).toHaveLength(0);
  });
  it('is never requested from the Timer, the Kicks tab or the history', async () => {
    for (const screen of [<TimerScreen />, <Kicks />, <TimerHistory />]) {
      const ui = await render(wrap(screen));
      await flush();
      await act(async () => {
        jest.advanceTimersByTime(60_000);
      });
      await cleanup();
      void ui;
    }
    expect(shown('interstitial')).toHaveLength(0);
  });
});

describe('rewarded unlocks (plan §12)', () => {
  const watch = async (ui: Awaited<ReturnType<typeof render>>, label: RegExp) => {
    await act(async () => {
      ui.root.findAll((n) => typeof n.props.onPress === 'function' && label.test(String(n.props.accessibilityLabel)))[0].props.onPress();
    });
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
  };

  it('unlocks a PDF look for good only when the video is watched to the end', async () => {
    const ui = await render(wrap(<PdfTheme />));
    await watch(ui, /^Watch a short video to unlock Soft Floral forever/);
    expect(shown('rewarded')).toHaveLength(1);
    await act(async () => {
      shown('rewarded')[0].emit('rewarded_earned_reward');
      shown('rewarded')[0].emit('closed');
    });
    await flush();
    expect(useUnlocks.getState().unlocks.pdfThemes).toEqual(['floral']);
    expect(ui.texts()).toContain('Soft Floral unlocked');
  });
  it('unlocks nothing when the video is closed early, and says to try later', async () => {
    const ui = await render(wrap(<PdfTheme />));
    await watch(ui, /^Watch a short video to unlock High-contrast print/);
    await act(async () => void shown('rewarded')[0].emit('closed'));
    await flush();
    expect(useUnlocks.getState().unlocks.pdfThemes).toEqual([]);
    expect(ui.texts()).toContain('No video is available right now. Please try again later.');
  });
  it('shows no video at all, and says "Available after your session", while a session or kick count is open', async () => {
    useSessions.getState().tap(NOW - 60_000);
    let ui = await render(wrap(<PdfTheme />));
    await watch(ui, /^Watch a short video to unlock Soft Floral/);
    expect(shown('rewarded')).toHaveLength(0);
    expect(ui.texts()).toContain('Available after your session');
    await cleanup();
    useSessions.getState().reset();
    useKicks.getState().start(NOW - 60_000);
    ui = await render(wrap(<HospitalBag />));
    await watch(ui, /^Watch a short video to add NICU bag/);
    expect(shown('rewarded')).toHaveLength(0);
    expect(ui.texts()).toContain('Available after your session');
  });
  it('the free "Clean" look needs no video, and a locked look is not usable until it is unlocked', async () => {
    const ui = await render(wrap(<PdfTheme />));
    expect(ui.byLabel(/^Clean\. In use/)).toHaveLength(1);
    useUnlocks.getState().selectPdfTheme('floral');
    expect(useUnlocks.getState().selectedPdfTheme).toBe('clean');
  });
  it('adds a checklist template for good after the video, and offers it again for free afterwards', async () => {
    const ui = await render(wrap(<HospitalBag />));
    await watch(ui, /^Watch a short video to add NICU bag/);
    await act(async () => {
      shown('rewarded')[0].emit('rewarded_earned_reward');
      shown('rewarded')[0].emit('closed');
    });
    await flush();
    expect(useUnlocks.getState().unlocks.checklistTemplates).toEqual(['nicu']);
    expect(useChecklists.getState().lists.hospitalBag!.items.some((i) => i.id.startsWith('tpl.nicu.'))).toBe(true);
    expect(ui.byLabel('NICU bag: Add to my list')).toHaveLength(1);
  });
  it('the default PDF is free and works with no ads at all', async () => {
    adsState.ready = false;
    try {
      const ui = await render(wrap(<PdfTheme />));
      expect(ui.byLabel(/^Clean\. In use/)).toHaveLength(1);
    } finally {
      adsState.ready = true;
    }
  });
});

describe('the app-open ad on a warm start (plan §12)', () => {
  let listeners: ((s: string) => void)[];
  let spy: jest.SpyInstance;
  const warmStart = async (awayMs: number) => {
    await act(async () => listeners.forEach((l) => l('background')));
    jest.setSystemTime(Date.now() + awayMs);
    await act(async () => listeners.forEach((l) => l('active')));
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
  };

  beforeEach(async () => {
    listeners = [];
    spy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, l: (s: string) => void) => {
      listeners.push(l);
      return { remove: () => undefined };
    }) as never);
    await render(wrap(<RootLayout />));
    useMeta.getState().update({ launches: 9, installAt: NOW - 9 * DAY });
  });
  afterEach(() => spy.mockRestore());

  it('does not show on a cold start, nor after a short break', async () => {
    expect(shown('appOpen')).toHaveLength(0);
    await warmStart(3 * 3_600_000);
    expect(shown('appOpen')).toHaveLength(0);
  });
  it('shows after 4 hours away, then not again for 4 hours', async () => {
    await warmStart(5 * 3_600_000);
    expect(shown('appOpen')).toHaveLength(1);
    await act(async () => shown('appOpen')[0].emit('closed'));
    expect(useAds.getState().state.lastAppOpenAt).toBeGreaterThan(0);
    freshAds();
    snapshot();
    await warmStart(4 * 3_600_000 + 60_000);
    expect(shown('appOpen')).toHaveLength(1); // 4 h and a minute away, but the last one closed a moment before it left
  });
  it('never with a session or kick count open, or within 30 minutes of a session ending, or in Partner mode', async () => {
    useSessions.getState().tap(Date.now());
    await warmStart(6 * 3_600_000);
    expect(shown('appOpen')).toHaveLength(0);
    useSessions.getState().reset();
    useKicks.getState().start(Date.now());
    await warmStart(6 * 3_600_000);
    expect(shown('appOpen')).toHaveLength(0);
    useKicks.getState().reset();
    await warmStart(5 * 3_600_000);
    useMeta.getState().update({ lastSessionEndedAt: Date.now() });
    freshAds();
    snapshot();
    await warmStart(4 * 3_600_000 + 1000); // the session ended just before the app went away: 4 h later it is fine, but not in the first 30 minutes
    useSettings.getState().update({ partnerMode: true });
    freshAds();
    snapshot();
    await warmStart(6 * 3_600_000);
    expect(shown('appOpen')).toHaveLength(0);
  });
  it('never in the first 3 launches or before day 2', async () => {
    useMeta.getState().update({ launches: 3 });
    await warmStart(6 * 3_600_000);
    expect(shown('appOpen')).toHaveLength(0);
    useMeta.getState().update({ launches: 9, installAt: NOW - 1 * DAY });
    await warmStart(6 * 3_600_000);
    expect(shown('appOpen')).toHaveLength(0);
  });
});

describe('the development ad-rules screen', () => {
  it('lists every placement with its reason when blocked, and the numbers the rules read', async () => {
    useSessions.getState().tap(NOW - 60_000);
    const ui = await render(wrap(<DebugAds />));
    expect(ui.texts().filter((x) => /: blocked$/.test(x))).toHaveLength(8);
    expect(ui.texts().filter((x) => x.includes('a contraction session is open')).length).toBeGreaterThanOrEqual(8);
    expect(ui.texts().some((x) => x.startsWith('sessionOpen: true'))).toBe(true);
  });
  it('says "would show" for a banner placed correctly when nothing is open', async () => {
    useAds.getState().setScreen('timerHistory');
    const ui = await render(wrap(<DebugAds />));
    expect(ui.texts()).toContain('history_banner: would show');
    expect(ui.texts()).toContain('pdf_theme_reward: would show');
  });
});

void useProfile;
