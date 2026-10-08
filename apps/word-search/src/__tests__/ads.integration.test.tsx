/**
 * The ads rules of plan §11 against the real @shared/ads layer with a fake AdMob SDK: consent
 * before the SDK, banners only where allowed, the interstitial cadence, the rewarded hint refill
 * and the app-open ad on a warm start. Nothing here talks to Google; it shows the wiring is right.
 */
import '@/testing/mocks';
import { adsOf, lastAd, mockSdk, resetAds } from '@shared/testing/adsNative';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { AppState } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { adsState } from '@shared/ads/state';
import { sharedStore } from '@shared/storage';
import { mockParams, mockReview, mockRouter } from '@/testing/mocks';
import '@/bootstrap';
import { installAdGuard } from '@/ads/guard';
import { startAds } from '@/ads/start';
import { adUnits, adPolicy } from '@/ads.config';
import { HintSheet } from '@/components/HintSheet';
import { levelPuzzle } from '@/domain/puzzles';
import { useAds } from '@/store/ads';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useResult } from '@/store/result';
import { useStats } from '@/store/stats';
import { db } from '@/store/storage';
import { palette, TOUCH_TARGET } from '@/theme/tokens';
import RootLayout from '../../app/_layout';
import Complete, { REVIEW_DELAY_MS } from '../../app/complete/[puzzleId]';
import { useSettings } from '@/store/settings';
import DailyTab from '../../app/(tabs)/daily';
import Home from '../../app/(tabs)/index';
import PackScreen from '../../app/packs/[packId]';
import Play from '../../app/play/[puzzleId]';
import SettingsScreen from '../../app/(tabs)/settings';

const wrap = (el: React.ReactElement) => <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;
const NOW = new Date(2026, 9, 8, 12, 0).getTime();
let removeGuard: () => void;

const bannersOf = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => (n.type as unknown) === 'BannerAd');

/** A player who is past the first session and the tutorial, ready to see ads. */
function seasonedPlayer() {
  sharedStore.set('onboarding.completedAt', 1);
  db.set('onboarding.tutorialDone', true);
  useStats.setState({ stats: { ...useStats.getState().stats, sessions: 3, puzzlesCompleted: 12 } });
}

/** Show counts at the start of each test: the fake ads live for the whole file. */
const baseline = new Map<unknown, number>();
function snapshot() {
  baseline.clear();
  for (const kind of ['interstitial', 'rewarded', 'appOpen'] as const) for (const ad of adsOf(kind)) baseline.set(ad, ad.showCalls);
}
/** The fake ads of this kind that were shown during the current test. */
const shown = (kind: 'interstitial' | 'rewarded' | 'appOpen') => adsOf(kind).filter((a) => a.showCalls > (baseline.get(a) ?? 0));

/** What happened while the app started, captured before any test clears the mocks. */
const startup = { gatherCalls: 0, gatherBeforeInit: false, initCalls: 0, config: null as unknown, interstitialIds: [] as string[], rewardedIds: [] as string[], appOpenIds: [] as string[] };

/** Everything the shared layer remembers between tests, back to a fresh session with ads loaded. */
function freshAds() {
  Object.assign(adsState, { interstitialsShown: 0, lastInterstitialAt: 0, interstitialActions: 0, fullScreenActive: false, fullScreenShown: 0 });
  for (const kind of ['interstitial', 'rewarded', 'appOpen'] as const) for (const ad of adsOf(kind)) ad.emit(kind === 'rewarded' ? 'rewarded_loaded' : 'loaded');
}

beforeAll(async () => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetAds();
  mockSdk.consent.canRequestAds = true;
  removeGuard = installAdGuard();
  await startAds();
  startup.gatherCalls = mockSdk.consent.gather.mock.calls.length;
  startup.gatherBeforeInit = mockSdk.consent.gather.mock.invocationCallOrder[0] < mockSdk.initialize.mock.invocationCallOrder[0];
  startup.initCalls = mockSdk.initialize.mock.calls.length;
  startup.config = mockSdk.setRequestConfiguration.mock.calls[0]?.[0];
  startup.interstitialIds = adsOf('interstitial').map((a) => a.unitId);
  startup.rewardedIds = adsOf('rewarded').map((a) => a.unitId);
  startup.appOpenIds = adsOf('appOpen').map((a) => a.unitId);
});
afterAll(() => {
  removeGuard();
  jest.useRealTimers();
});
beforeEach(() => {
  jest.setSystemTime(NOW);
  resetApp(new Date(NOW));
  jest.clearAllMocks();
  snapshot();
  freshAds();
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('onboarding.completedAt');
});

describe('consent and start-up (plan §6 screen 4, F10)', () => {
  it('asks for consent before the SDK starts, and starts it once', () => {
    expect(startup.gatherCalls).toBe(1);
    expect(startup.gatherBeforeInit).toBe(true);
    expect(startup.initCalls).toBe(1);
  });
  it("limits ads to PG, the plan's older-audience rating", () => {
    expect(startup.config).toEqual(expect.objectContaining({ maxAdContentRating: 'PG' }));
  });
  it('preloads the interstitial, the rewarded hint ad and the app-open ad with Google test ids', () => {
    expect(startup.interstitialIds).toEqual(['test-interstitial']);
    expect(startup.rewardedIds).toEqual(['test-rewarded']);
    expect(startup.appOpenIds).toEqual(['test-app-open']);
  });
  it('uses the placements of the plan', () => {
    expect(Object.keys(adUnits).sort()).toEqual(['app_open', 'hint_refill', 'home_banner', 'level_complete', 'packs_banner']);
    expect(adPolicy).toMatchObject({ interstitialMinIntervalMs: 90_000, appOpenMinBackgroundMs: 240_000, firstSessionGraceMs: 0 });
  });
});

describe('banners (plan §11)', () => {
  it('Home, a pack list and the Daily tab show one banner each for a seasoned player', async () => {
    seasonedPlayer();
    mockParams.current = { packId: 'animals' };
    for (const screen of [<Home />, <PackScreen />, <DailyTab />]) {
      const ui = await render(wrap(screen));
      await flush();
      expect(bannersOf(ui)).toHaveLength(1);
      expect(bannersOf(ui)[0].props.unitId).toBe('test-banner');
      await cleanup();
    }
  });

  it('shows no banner before the tutorial is done', async () => {
    useStats.setState({ stats: { ...useStats.getState().stats, sessions: 3, puzzlesCompleted: 12 } });
    sharedStore.set('onboarding.completedAt', 1); // setup is done, the tutorial is not
    const ui = await render(wrap(<Home />));
    await flush();
    expect(bannersOf(ui)).toHaveLength(0);
  });

  it('shows no banner in the first session until level 2 is completed', async () => {
    sharedStore.set('onboarding.completedAt', 1);
    db.set('onboarding.tutorialDone', true);
    useStats.setState({ stats: { ...useStats.getState().stats, sessions: 1, puzzlesCompleted: 1 } });
    const early = await render(wrap(<Home />));
    await flush();
    expect(bannersOf(early)).toHaveLength(0);
    await cleanup();
    useStats.setState({ stats: { ...useStats.getState().stats, sessions: 1, puzzlesCompleted: 2 } });
    const later = await render(wrap(<Home />));
    await flush();
    expect(bannersOf(later)).toHaveLength(1);
  });

  it('never puts a banner on the game screen, the Complete screen or Settings', async () => {
    seasonedPlayer();
    mockParams.current = { puzzleId: 'animals:easy:1' };
    useResult.getState().set({ puzzleId: 'animals:easy:3', packId: 'animals', difficulty: 'easy', level: 3, isDaily: false, isTutorial: false, stars: 3, wordsFound: 6, elapsedMs: 0, hintsUsed: 0 });
    for (const screen of [<Play />, <Complete />, <SettingsScreen />]) {
      const ui = await render(wrap(screen));
      await act(async () => {
        jest.advanceTimersByTime(10);
      });
      await flush();
      expect(bannersOf(ui)).toHaveLength(0);
      await cleanup();
    }
  });

  it('leaves no blank slot when no ad is available', async () => {
    seasonedPlayer();
    adsState.ready = false;
    try {
      const ui = await render(wrap(<Home />));
      await flush();
      expect(bannersOf(ui)).toHaveLength(0);
    } finally {
      adsState.ready = true;
    }
  });
});

describe('interstitial after "Next puzzle" (plan §11)', () => {
  const result = (over: Record<string, unknown> = {}) => ({ puzzleId: 'animals:easy:3', packId: 'animals', difficulty: 'easy' as const, level: 3, isDaily: false, isTutorial: false, stars: 3 as const, wordsFound: 6, elapsedMs: 0, hintsUsed: 0, ...over });
  const next = async (r = result(), levels = 3) => {
    seasonedPlayer();
    useResult.getState().set(r);
    useAds.setState({ counters: { ...useAds.getState().counters, levelsSinceInterstitial: levels } });
    const ui = await render(wrap(<Complete />));
    await flush();
    return ui;
  };
  const tapNext = async (ui: Awaited<ReturnType<typeof render>>, label = 'Next puzzle') => {
    await ui.press(label);
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
  };
  const closeAd = async () => act(async () => shown('interstitial')[0].emit('closed'));
  const nextUrl = { pathname: '/play/[puzzleId]', params: { puzzleId: 'animals:easy:4' } };

  it('shows after every 3rd puzzle, waits for the ad to close, then loads the next puzzle', async () => {
    const ui = await next();
    await tapNext(ui);
    expect(shown('interstitial')).toHaveLength(1);
    expect(mockRouter.replace).not.toHaveBeenCalled(); // the ad is on screen
    await closeAd();
    expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
    expect(useAds.getState().counters.levelsSinceInterstitial).toBe(0);
    expect(useAds.getState().counters.interstitialTimes).toHaveLength(1);
  });

  it('does not show before the 3rd puzzle, and goes straight to the next one', async () => {
    const ui = await next(result(), 2);
    await tapNext(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
  });

  it('is not held up by an ad that fails to show', async () => {
    const ui = await next();
    for (const ad of adsOf('interstitial')) ad.failShow = true;
    try {
      await tapNext(ui);
      await flush();
      expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
      expect(useAds.getState().counters.levelsSinceInterstitial).toBe(3); // nothing was shown, so the count stands
    } finally {
      for (const ad of adsOf('interstitial')) ad.failShow = false;
    }
  });

  it('never after a daily puzzle (it has no "next puzzle", it goes home), nor the tutorial', async () => {
    const daily = await next(result({ isDaily: true, level: undefined, dateKey: '2026-10-08', puzzleId: 'daily:2026-10-08:easy' }));
    expect(daily.byLabel('Next puzzle')).toHaveLength(0);
    await daily.press('Back to home');
    expect(shown('interstitial')).toHaveLength(0);
    await cleanup();
    const tutorial = await next(result({ isTutorial: true }));
    await tapNext(tutorial, 'Play the next puzzle');
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('never in the first session before level 2 is completed', async () => {
    seasonedPlayer();
    useStats.setState({ stats: { ...useStats.getState().stats, sessions: 1, puzzlesCompleted: 1 } });
    useResult.getState().set(result());
    useAds.setState({ counters: { ...useAds.getState().counters, levelsSinceInterstitial: 3 } });
    const ui = await render(wrap(<Complete />));
    await tapNext(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
  });

  it('keeps 90 s between interstitials: a second one right after is skipped, and one 95 s later is allowed', async () => {
    const first = await next();
    await tapNext(first);
    await closeAd();
    expect(shown('interstitial')).toHaveLength(1);
    await cleanup();
    mockRouter.replace.mockClear();
    freshAds();
    const second = await next(result(), 3);
    await tapNext(second);
    expect(shown('interstitial')).toHaveLength(1); // still only the first
    expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
    await cleanup();
    jest.setSystemTime(NOW + 95_000);
    freshAds();
    const third = await next(result(), 3);
    await tapNext(third);
    expect(shown('interstitial')).toHaveLength(2);
  });

  it('skips the interstitial in the cycle where the store review was requested (plan §12)', async () => {
    mockReview.available = true;
    useSettings.getState().update({ reminder: { enabled: true, hour: 9, minute: 0 } });
    sharedStore.set('install.firstOpenAt', 0);
    const ui = await next(result({ stars: 3 }), 3);
    useStats.setState({ stats: { ...useStats.getState().stats, sessions: 3, puzzlesCompleted: 12 } });
    await act(async () => {
      jest.advanceTimersByTime(REVIEW_DELAY_MS + 10);
    });
    await flush();
    expect(mockReview.request).toHaveBeenCalledTimes(1);
    await tapNext(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
    expect(useAds.getState().counters.levelsSinceInterstitial).toBe(3); // still due next time
  });

  it('allows at most 6 an hour', async () => {
    seasonedPlayer();
    const recent = Array.from({ length: 6 }, (_, i) => NOW - 120_000 - i * 60_000);
    useAds.setState({ counters: { ...useAds.getState().counters, interstitialTimes: recent } });
    const ui = await next();
    await tapNext(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
  });

  it('not within 90 s of a rewarded ad', async () => {
    useAds.setState({ lastRewardedAt: NOW - 30_000, lastFullScreenAt: NOW - 30_000 });
    const ui = await next();
    await tapNext(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalledWith(nextUrl);
  });
});

describe('rewarded hint refill (plan §8.5)', () => {
  const open = async () => {
    seasonedPlayer();
    useHints.setState({ wallet: { free: 0, bonus: 0, resetDateKey: '2026-10-08' } });
    const ui = await render(wrap(<HintSheet visible onClose={() => undefined} />));
    await ui.press('Watch video');
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    return ui;
  };

  it('adds 2 hints only when the reward was earned, and records the rewarded ad', async () => {
    const ui = await open();
    const ad = shown('rewarded')[0];
    expect(ad).toBeDefined();
    await act(async () => {
      ad.emit('rewarded_earned_reward', { amount: 1 });
      ad.emit('closed');
    });
    await flush();
    expect(useHints.getState().wallet.bonus).toBe(2);
    expect(ui.texts()).toContain('You earned 2 more hints.');
    expect(useAds.getState().lastRewardedAt).toBe(NOW);
  });

  it('adds nothing when the video is closed early', async () => {
    const ui = await open();
    await act(async () => shown('rewarded')[0].emit('closed'));
    await flush();
    expect(useHints.getState().wallet.bonus).toBe(0);
    expect(ui.texts()).toContain("The video didn't finish, so no hints were added.");
  });
});

describe('app-open ad on a warm start (plan §11)', () => {
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
  const shownAppOpens = () => shown('appOpen');

  beforeEach(async () => {
    listeners = [];
    spy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, l: (s: string) => void) => {
      listeners.push(l);
      return { remove: () => undefined };
    }) as never);
    seasonedPlayer();
    await render(wrap(<RootLayout />));
    seasonedPlayer(); // RootLayout counts this launch
    useStats.setState({ stats: { ...useStats.getState().stats, sessions: 3 } });
  });
  afterEach(() => spy.mockRestore());

  it('does not show on a cold start (nothing happens until the app comes back)', () => {
    expect(shownAppOpens()).toHaveLength(0);
  });

  it('does not show after a short break (under 4 minutes)', async () => {
    await warmStart(3 * 60_000);
    expect(shownAppOpens()).toHaveLength(0);
  });

  it('shows after 4 minutes away, then not again for 4 hours', async () => {
    await warmStart(5 * 60_000);
    const first = shownAppOpens();
    expect(first).toHaveLength(1);
    await act(async () => first[0].emit('closed'));
    expect(useAds.getState().counters.lastAppOpenAt).toBeGreaterThan(0);
    freshAds();
    await warmStart(10 * 60_000); // ten minutes later: too soon
    expect(shownAppOpens()).toHaveLength(1);
    await warmStart(4 * 60 * 60_000 + 60_000);
    expect(shownAppOpens().length).toBeGreaterThanOrEqual(2);
  });

  it('does not show while a puzzle is in progress', async () => {
    useGame.getState().begin(levelPuzzle('animals', 'easy', 1, 8));
    await warmStart(10 * 60_000);
    expect(shownAppOpens()).toHaveLength(0);
  });

  it('does not show in the first session', async () => {
    useStats.setState({ stats: { ...useStats.getState().stats, sessions: 1, puzzlesCompleted: 0 } });
    await warmStart(10 * 60_000);
    expect(shownAppOpens()).toHaveLength(0);
  });

  it('does not show right after a rewarded or interstitial ad', async () => {
    useAds.getState().recordShown('rewarded', Date.now());
    await warmStart(60_000); // too short anyway: test the rule directly below
    const { adAllowed } = require('@/domain/adRules') as typeof import('@/domain/adRules');
    const { adContext } = require('@/ads/guard') as typeof import('@/ads/guard');
    jest.setSystemTime(Date.now() + 5 * 60_000);
    useAds.getState().recordShown('interstitial', Date.now() - 30_000);
    expect(adAllowed('app_open', adContext())).toBe(false);
  });
});
