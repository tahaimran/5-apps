/**
 * The ad rules of plan §12 against the real @shared/ads layer with a fake AdMob SDK: consent before the
 * SDK, banners only where allowed, never an ad mid-question, the interstitial cadence between rounds,
 * the four rewarded flows and the app-open ad on a warm start. Nothing here talks to Google; it shows the
 * wiring is right.
 */
import '@/testing/mocks';
import { adsOf, mockSdk, resetAds } from '@shared/testing/adsNative';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { AppState } from 'react-native';
import { adsState } from '@shared/ads/state';
import { showInterstitial, showRewarded } from '@shared/ads';
import { sharedStore } from '@shared/storage';
import { mockParams, mockReview, mockRouter } from '@/testing/mocks';
import '@/bootstrap';
import { adContext, installAdGuard, setProcessStartForTests } from '@/ads/guard';
import { startAds } from '@/ads/start';
import { resetRewardedForTests } from '@/features/ads/rewarded';
import { adPolicy, adUnits } from '@/ads.config';
import { addDays, dateKeyFor } from '@/domain/dateKey';
import { completeDailyStreak } from '@/domain/streak';
import { defaultStreak } from '@/domain/defaults';
import { recordDaily } from '@/domain/daily';
import { commitRound } from '@/features/play/commit';
import { REVIEW_DELAY_MS } from '@/features/play/useReviewPrompt';
import { startCategory, startClassic, startDaily } from '@/features/play/start';
import { answer, next } from '@/domain/round';
import { useAds } from '@/store/ads';
import { useResult } from '@/store/result';
import { useRound } from '@/store/round';
import { db } from '@/store/storage';
import { useAdCounters, useClassic, useDaily, useProfile, useStats, useStreak } from '@/store/stores';
import RootLayout from '../../app/_layout';
import Results from '../../app/results/[sessionId]';
import Quiz from '../../app/quiz/[sessionId]';
import Home from '../../app/(tabs)/index';
import Play from '../../app/(tabs)/play';
import Stats from '../../app/(tabs)/stats';
import Settings from '../../app/(tabs)/settings';
import ClassicCategories from '../../app/classic/index';
import DailyResult from '../../app/daily/result';
import Welcome from '../../app/(onboarding)/welcome';

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const NOW = new Date(2026, 9, 8, 12, 0).getTime();
const DAY = 86_400_000;
let removeGuard: () => void;

const bannersOf = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => (n.type as unknown) === 'BannerAd');
const nativeOf = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => (n.type as unknown) === 'NativeAdView');

/** A player past the first session and onboarding, ready to see ads. */
function seasonedPlayer() {
  sharedStore.set('onboarding.completedAt', 1);
  db.set('onboarding.done', true);
  useStats.getState().update({ sessions: 3, roundsPlayed: 12, firstOpenAt: NOW - 10 * DAY });
  setProcessStartForTests(NOW - 10 * 60_000);
}

/** Show counts at the start of each test: the fake ads live for the whole file. */
const baseline = new Map<unknown, number>();
function snapshot() {
  baseline.clear();
  for (const kind of ['interstitial', 'rewarded', 'appOpen'] as const) for (const ad of adsOf(kind)) baseline.set(ad, ad.showCalls);
}
const shown = (kind: 'interstitial' | 'rewarded' | 'appOpen') => adsOf(kind).filter((a) => a.showCalls > (baseline.get(a) ?? 0));

const startup = { gatherCalls: 0, gatherBeforeInit: false, initCalls: 0, config: null as unknown, ids: {} as Record<string, string[]> };

/** Everything the shared layer remembers between tests: a fresh session with ads loaded. */
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
  for (const kind of ['interstitial', 'rewarded', 'appOpen']) startup.ids[kind] = adsOf(kind as 'rewarded').map((a) => a.unitId);
});
afterAll(() => {
  removeGuard();
  jest.useRealTimers();
});
beforeEach(() => {
  jest.setSystemTime(NOW);
  resetApp(new Date(NOW));
  jest.clearAllMocks();
  resetRewardedForTests();
  useAds.setState({ lastFullScreenAt: 0, lastRewardedAt: 0, lastExternalOpenAt: 0, screen: 'other' });
  snapshot();
  freshAds();
});
afterEach(async () => {
  // Close any ad a test left on screen, so the shared layer reloads it and the next test starts clean.
  await act(async () => {
    for (const kind of ['interstitial', 'rewarded', 'appOpen'] as const) for (const ad of adsOf(kind)) ad.emit('closed');
  });
  await cleanup();
  sharedStore.remove('onboarding.completedAt');
});

describe('consent and start-up (plan §6 O6, §12)', () => {
  it('asks for consent before the SDK starts, and starts it once', () => {
    expect(startup.gatherCalls).toBe(1);
    expect(startup.gatherBeforeInit).toBe(true);
    expect(startup.initCalls).toBe(1);
  });
  it("limits ads to the plan's maximum content rating T", () => {
    expect(startup.config).toEqual(expect.objectContaining({ maxAdContentRating: 'T' }));
  });
  it('preloads the interstitial, the four rewarded units and the app-open ad with Google test ids', () => {
    expect(startup.ids.interstitial).toEqual(['test-interstitial']);
    expect(startup.ids.rewarded).toEqual(['test-rewarded', 'test-rewarded', 'test-rewarded', 'test-rewarded']);
    expect(startup.ids.appOpen).toEqual(['test-app-open']);
  });
  it('uses the placements of the plan and its caps', () => {
    expect(Object.keys(adUnits).sort()).toEqual(['app_open', 'double_xp', 'extra_life', 'lifeline', 'menu', 'results_native', 'round_end', 'streak_restore']);
    expect(adPolicy).toMatchObject({ interstitialMinIntervalMs: 90_000, appOpenMinBackgroundMs: 4 * 3_600_000, firstSessionGraceMs: 0 });
  });
  it('does not request ads while consent is withheld, and asks again only through the privacy options', async () => {
    expect(adsState.ready).toBe(true); // consent was given in this file
    expect(mockSdk.consent.gather).toHaveBeenCalledTimes(0); // cleared by clearAllMocks: nothing re-asked
  });
});

describe('banners (plan §12)', () => {
  it('Home, Play, Classic, Stats and Settings show one banner each', async () => {
    seasonedPlayer();
    for (const screen of [<Home />, <Play />, <ClassicCategories />, <Stats />, <Settings />]) {
      const ui = await render(screen);
      await flush();
      expect(bannersOf(ui)).toHaveLength(1);
      expect(bannersOf(ui)[0].props.unitId).toBe('test-banner');
      await cleanup();
    }
  });

  it('shows no banner before onboarding is done, or in the onboarding screens', async () => {
    useStats.getState().update({ sessions: 3 });
    sharedStore.set('onboarding.completedAt', 1); // setup is done, the warm-up and closing screens are not
    const home = await render(<Home />);
    await flush();
    expect(bannersOf(home)).toHaveLength(0);
    await cleanup();
    const welcome = await render(<Welcome />);
    expect(bannersOf(welcome)).toHaveLength(0);
  });

  it('never puts a banner on the question screen, the explanation, Results or the Daily result', async () => {
    seasonedPlayer();
    const id = startClassic('science', 1)!;
    mockParams.current = { sessionId: id };
    const quiz = await render(<Quiz />);
    await flush();
    expect(bannersOf(quiz)).toHaveLength(0);
    await quiz.press(/^Answer [ABCD], /); // the explanation is up
    expect(quiz.byLabel(/^(Next|See results)$/).length).toBe(1);
    expect(bannersOf(quiz)).toHaveLength(0);
    expect(nativeOf(quiz)).toHaveLength(0);
    await cleanup();
    const cat = startCategory('music', 2)!;
    finish(cat);
    mockParams.current = { sessionId: cat };
    const results = await render(<Results />);
    await flush();
    expect(bannersOf(results)).toHaveLength(0);
    await cleanup();
    const daily = startDaily()!;
    finish(daily);
    const dailyResult = await render(<DailyResult />);
    await flush();
    expect(bannersOf(dailyResult)).toHaveLength(0);
    expect(nativeOf(dailyResult)).toHaveLength(0);
  });

  it('leaves no blank slot when no ad is available', async () => {
    seasonedPlayer();
    adsState.ready = false;
    try {
      const ui = await render(<Home />);
      await flush();
      expect(bannersOf(ui)).toHaveLength(0);
    } finally {
      adsState.ready = true;
    }
  });
});

/** Plays the round in the store to its end and commits it, as the quiz screen does. */
function finish(id: string, pick: 'right' | 'wrong' = 'right') {
  let s = useRound.getState().state!;
  while (s.phase !== 'done') s = s.phase === 'question' ? answer(s, pick === 'right' ? s.current.correctIndex : (s.current.correctIndex + 1) % 4) : next(s);
  commitRound(id, s, 60_000);
}

describe('never an ad mid-question', () => {
  it('the guard blocks the interstitial and every placement while the question screen is in front', async () => {
    seasonedPlayer();
    useAdCounters.getState().update({ roundsSinceInterstitial: 5 });
    const id = startClassic('science', 1)!;
    mockParams.current = { sessionId: id };
    await render(<Quiz />);
    expect(useAds.getState().screen).toBe('quiz');
    expect(await showInterstitial('round_end')).toBe(false);
    expect(shown('interstitial')).toHaveLength(0);
  });
});

describe('interstitial between rounds (plan §12)', () => {
  const open = async (rounds = 2, mode: 'category' | 'classic' = 'category') => {
    seasonedPlayer();
    useAdCounters.getState().update({ roundsSinceInterstitial: 0 });
    const id = mode === 'category' ? startCategory('music', 2)! : startClassic('music', 1)!;
    finish(id); // counts one round
    useAdCounters.getState().update({ roundsSinceInterstitial: rounds });
    mockParams.current = { sessionId: id };
    const ui = await render(<Results />);
    await flush();
    return ui;
  };
  const tap = async (ui: Awaited<ReturnType<typeof render>>, label: string | RegExp = 'Play again') => {
    await ui.press(label);
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
  };
  const closeAd = async () => act(async () => shown('interstitial')[0].emit('closed'));

  it('shows after every 2nd round, waits for the ad to close, then loads the next round', async () => {
    const ui = await open(2);
    await tap(ui);
    expect(shown('interstitial')).toHaveLength(1);
    expect(mockRouter.replace).not.toHaveBeenCalled(); // the ad is on screen
    await closeAd();
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
    expect(useAdCounters.getState().value.roundsSinceInterstitial).toBe(0);
    expect(useAdCounters.getState().value.interstitialDay).toEqual({ date: '2026-10-08', count: 1 });
  });

  it('also covers Home from Results', async () => {
    const ui = await open(2);
    await tap(ui, 'Home');
    expect(shown('interstitial')).toHaveLength(1);
    await closeAd();
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('does not show after the 1st round, and goes straight on', async () => {
    const ui = await open(1);
    await tap(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
  });

  it('is not held up by an ad that fails to show, and the count stands', async () => {
    const ui = await open(2);
    for (const ad of adsOf('interstitial')) ad.failShow = true;
    try {
      await tap(ui);
      await flush();
      expect(mockRouter.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
      expect(useAdCounters.getState().value.roundsSinceInterstitial).toBe(2); // nothing was shown, so the count stands
    } finally {
      for (const ad of adsOf('interstitial')) ad.failShow = false;
    }
  });

  it('never in the first session', async () => {
    seasonedPlayer();
    useStats.getState().update({ sessions: 1 });
    const id = startCategory('music', 2)!;
    finish(id);
    useAdCounters.getState().update({ roundsSinceInterstitial: 4 });
    mockParams.current = { sessionId: id };
    const ui = await render(<Results />);
    await tap(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('never in the first 60 seconds of a session', async () => {
    const ui = await open(2);
    setProcessStartForTests(NOW - 30_000);
    await tap(ui);
    expect(shown('interstitial')).toHaveLength(0);
  });

  it('keeps 90 s between interstitials: a second one right after is skipped, and one 95 s later is allowed', async () => {
    const first = await open(2);
    await tap(first);
    await closeAd();
    expect(shown('interstitial')).toHaveLength(1);
    await cleanup();
    mockRouter.replace.mockClear();
    freshAds();
    const second = await open(2);
    await tap(second);
    expect(shown('interstitial')).toHaveLength(1); // still only the first
    expect(mockRouter.replace).toHaveBeenCalled();
    await cleanup();
    jest.setSystemTime(NOW + 95_000);
    freshAds();
    const third = await open(2);
    await tap(third);
    expect(shown('interstitial')).toHaveLength(2);
  });

  it('stops at 8 a day', async () => {
    const ui = await open(2);
    useAdCounters.getState().update({ interstitialDay: { date: '2026-10-08', count: 8 } });
    await tap(ui);
    expect(shown('interstitial')).toHaveLength(0);
    await cleanup();
    useAdCounters.getState().update({ interstitialDay: { date: '2026-10-07', count: 8 } }); // yesterday's count does not carry over
    const next = await open(2);
    await tap(next);
    expect(shown('interstitial')).toHaveLength(1);
  });

  it('not within 90 s of a rewarded ad', async () => {
    const ui = await open(2);
    useAds.setState({ lastRewardedAt: NOW - 30_000, lastFullScreenAt: NOW - 30_000 });
    await tap(ui);
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('skips the interstitial in the cycle where the store review was requested', async () => {
    mockReview.available = true;
    sharedStore.set('install.firstOpenAt', 0);
    const ui = await open(2, 'classic');
    await act(async () => {
      jest.advanceTimersByTime(REVIEW_DELAY_MS + 10);
    });
    await flush();
    expect(mockReview.request).toHaveBeenCalledTimes(1);
    await tap(ui, 'Home');
    expect(shown('interstitial')).toHaveLength(0);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('never leaves the Daily result through an interstitial', async () => {
    seasonedPlayer();
    useAdCounters.getState().update({ roundsSinceInterstitial: 6 });
    const id = startDaily()!;
    finish(id);
    const ui = await render(<DailyResult />);
    await tap(ui, 'Home');
    expect(shown('interstitial')).toHaveLength(0);
  });
});

describe('native card on Results (plan §12)', () => {
  it('shows one native ad below the buttons on Results, never on the Daily result', async () => {
    seasonedPlayer();
    mockSdk.native.current = { status: 'loaded', nativeAd: { headline: 'Learn a language', body: 'Free lessons', callToAction: 'Install' }, error: null };
    const id = startCategory('music', 2)!;
    finish(id);
    mockParams.current = { sessionId: id };
    const ui = await render(<Results />);
    await flush();
    expect(nativeOf(ui)).toHaveLength(1);
    expect(ui.texts()).toContain('Ad');
    await cleanup();
    const daily = startDaily()!;
    finish(daily);
    const dr = await render(<DailyResult />);
    expect(nativeOf(dr)).toHaveLength(0);
  });
});

describe('rewarded: extra lifeline (plan §12)', () => {
  const quiz = async (start: () => string | null = () => startCategory('science', 2)) => {
    seasonedPlayer();
    const id = start()!;
    mockParams.current = { sessionId: id };
    const ui = await render(<Quiz />);
    await flush();
    return ui;
  };
  const spend = async (ui: Awaited<ReturnType<typeof render>>, name: string) => {
    await ui.press(new RegExp(`^${esc(name)}, 1 left$`));
  };
  const watch = async (ui: Awaited<ReturnType<typeof render>>) => {
    await ui.press('Watch video');
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
  };

  it('offers a video once a lifeline is used up, and grants +1 only when the reward is earned', async () => {
    const ui = await quiz();
    expect(ui.byLabel(/Watch a short video for one more/)).toHaveLength(0); // the free one is still there
    await spend(ui, '50/50');
    await ui.press(/^50\/50\. Watch a short video for one more$/);
    expect(ui.texts().join(' ')).toContain('Watch a short video for one more 50/50.');
    await watch(ui);
    const ad = shown('rewarded')[0];
    expect(ad).toBeDefined();
    await act(async () => {
      ad.emit('rewarded_earned_reward', { amount: 1 });
      ad.emit('closed');
    });
    await flush();
    expect(useRound.getState().state!.lifelines.fifty).toBe(1);
    expect(useRound.getState().state!.rewardedUsed).toBe(1);
    expect(useAds.getState().lastRewardedAt).toBe(NOW);
    expect(useAdCounters.getState().value.rewardedDay).toEqual({ date: '2026-10-08', count: 1 });
    expect(ui.byLabel(/^50\/50, 1 left$/)).toHaveLength(1); // usable again
  });

  it('grants nothing when the video is closed early, and says so', async () => {
    const ui = await quiz();
    await spend(ui, 'Skip');
    await ui.press(/^Skip\. Watch/);
    await watch(ui);
    await act(async () => shown('rewarded')[0].emit('closed'));
    await flush();
    expect(useRound.getState().state!.lifelines.skip).toBe(0);
    expect(ui.texts().join(' ')).toContain('The video was closed before the end, so nothing was added.');
  });

  it('says "Not available right now" at once when no ad is loaded, and grants nothing', async () => {
    const ui = await quiz();
    await spend(ui, '+Time');
    await ui.press(/^\+Time\. Watch/);
    // Use up the loaded ad of this placement elsewhere: its replacement has not loaded (no loaded event yet).
    const spent = showRewarded('lifeline');
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    shown('rewarded')[0].emit('closed');
    await spent;
    const before = shown('rewarded').length;
    await ui.press('Watch video');
    await flush();
    expect(shown('rewarded')).toHaveLength(before);
    expect(ui.texts().join(' ')).toContain('Not available right now');
    expect(useRound.getState().state!.lifelines.time).toBe(0);
  });

  it('a fast double tap on Watch video plays one ad and grants once', async () => {
    const ui = await quiz();
    await spend(ui, '50/50');
    await ui.press(/^50\/50\. Watch/);
    await ui.press('Watch video');
    // While the first ad is up the button is disabled, so a second tap cannot start another one.
    expect(ui.byLabel('Watch video')[0].props.accessibilityState.disabled).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    expect(shown('rewarded')).toHaveLength(1);
    await act(async () => {
      shown('rewarded')[0].emit('rewarded_earned_reward', { amount: 1 });
      shown('rewarded')[0].emit('closed');
    });
    await flush();
    expect(useRound.getState().state!.lifelines.fifty).toBe(1);
    expect(useRound.getState().state!.rewardedUsed).toBe(1);
  });

  it('stops offering after 2 videos in one round', async () => {
    const ui = await quiz();
    for (const name of ['50/50', 'Skip']) {
      await spend(ui, name);
      await ui.press(new RegExp(`^${esc(name)}\\. Watch`));
      await watch(ui);
      await act(async () => {
        shown('rewarded').at(-1)!.emit('rewarded_earned_reward', { amount: 1 });
        shown('rewarded').at(-1)!.emit('closed');
      });
      await flush();
      freshAds();
      snapshot();
    }
    expect(useRound.getState().state!.rewardedUsed).toBe(2);
    await spend(ui, '+Time');
    expect(ui.byLabel(/^\+Time\. Watch/)).toHaveLength(0);
    expect(ui.byLabel('+Time, used')).toHaveLength(1);
  });

  it('is never offered in the Daily Challenge', async () => {
    const ui = await quiz(() => startDaily());
    await ui.press(/^Skip, 1 left$/);
    expect(ui.byLabel(/Watch a short video/)).toHaveLength(0);
    expect(ui.byLabel('Skip, used')).toHaveLength(1);
  });

  it('stops after 15 lifeline videos in a day', async () => {
    const ui = await quiz();
    useAdCounters.getState().update({ rewardedDay: { date: '2026-10-08', count: 15 } });
    await spend(ui, '50/50');
    expect(ui.byLabel(/^50\/50\. Watch/)).toHaveLength(0);
  });

  it('the clock stands still while the offer is open', async () => {
    const ui = await quiz();
    await spend(ui, '50/50');
    await ui.press(/^50\/50\. Watch/);
    const before = useRound.getState().state!.msLeft;
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(useRound.getState().state!.msLeft).toBe(before);
    await ui.press('No thanks');
    expect(ui.texts().join(' ')).not.toContain('Out of 50/50?');
  });
});

describe('rewarded: continue with 1 heart (plan §8, §12)', () => {
  const hardLevel = async () => {
    seasonedPlayer();
    useClassic.getState().set({ science: { stars: {}, unlocked: 30, bestScores: {} } });
    const id = startClassic('science', 21)!;
    mockParams.current = { sessionId: id };
    const ui = await render(<Quiz />);
    await flush();
    const missTo = async (n: number) => {
      for (let i = 0; i < n; i++) {
        const s = useRound.getState().state!;
        const wrong = s.current.options.find((_, j) => j !== s.current.correctIndex)!;
        await ui.press(new RegExp(`^Answer [ABCD], ${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
        if (i < n - 1) await ui.press('Next');
      }
    };
    return { ui, missTo };
  };

  it('offers one video at 0 hearts; earning it continues with 1 heart on the next question', async () => {
    const { ui, missTo } = await hardLevel();
    await missTo(3);
    await ui.press('See results'); // opens the offer instead of ending
    expect(ui.texts().join(' ')).toContain('Out of hearts');
    await ui.press('Watch video');
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    await act(async () => {
      shown('rewarded')[0].emit('rewarded_earned_reward', { amount: 1 });
      shown('rewarded')[0].emit('closed');
    });
    await flush();
    const s = useRound.getState().state!;
    expect(s).toMatchObject({ hearts: 1, heartContinueUsed: true, phase: 'question' });
    expect(useResult.getState().last).toBeNull(); // the level goes on
  });

  it('"End level" and a video that is not earned both end the level, and it is offered once only', async () => {
    const { ui, missTo } = await hardLevel();
    await missTo(3);
    await ui.press('See results');
    await ui.press('End level');
    expect(useResult.getState().last).toMatchObject({ failedByHearts: true });
  });
});

describe('rewarded: Double XP (plan §8, §12)', () => {
  const results = async (pick: 'right' | 'wrong' = 'right') => {
    seasonedPlayer();
    const id = startCategory('music', 2)!;
    finish(id, pick);
    mockParams.current = { sessionId: id };
    const ui = await render(<Results />);
    await flush();
    return { ui, id };
  };
  const earn = async (ui: Awaited<ReturnType<typeof render>>) => {
    await ui.press(/^Double XP/);
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    await act(async () => {
      shown('rewarded').at(-1)!.emit('rewarded_earned_reward', { amount: 1 });
      shown('rewarded').at(-1)!.emit('closed');
    });
    await flush();
  };

  it('doubles the round XP once, when the reward is earned, and counts it for the day', async () => {
    const { ui } = await results();
    const before = useProfile.getState().value.xp;
    expect(before).toBe(150);
    await earn(ui);
    expect(useProfile.getState().value.xp).toBe(300);
    expect(useResult.getState().last).toMatchObject({ xp: 300, baseXp: 150, doubled: true });
    expect(useStats.getState().value.doubleXpToday).toEqual({ date: '2026-10-08', count: 1 });
    expect(ui.byLabel(/^Double XP/)).toHaveLength(0); // not offered twice
  });

  it('is not offered at a score of 0, nor after 3 today', async () => {
    const zero = await results('wrong');
    expect(zero.ui.byLabel(/^Double XP/)).toHaveLength(0);
    await cleanup();
    useStats.getState().update({ doubleXpToday: { date: '2026-10-08', count: 3 } });
    const capped = await results();
    expect(capped.ui.byLabel(/^Double XP/)).toHaveLength(0);
  });

  it('adds nothing when the video is closed early', async () => {
    const { ui } = await results();
    await ui.press(/^Double XP/);
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    await act(async () => shown('rewarded')[0].emit('closed'));
    await flush();
    expect(useProfile.getState().value.xp).toBe(150);
    expect(ui.texts().join(' ')).toContain('The video was closed before the end, so nothing was added.');
  });
});

describe('rewarded: restore streak (plan §8, §12)', () => {
  const brokenStreak = () => {
    seasonedPlayer();
    const today = dateKeyFor(new Date(NOW));
    let s = defaultStreak();
    for (const i of [4, 3, 2]) s = completeDailyStreak(s, addDays(today, -i), NOW - i * DAY, 0).state;
    useStreak.setState({ value: s });
    useDaily.setState({ value: recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, addDays(today, -2), 7) });
  };

  it('offers the restore on Home after exactly one missed day, and brings the streak back when earned', async () => {
    brokenStreak();
    const ui = await render(<Home />);
    await flush();
    expect(ui.texts().join(' ')).toContain('Restore your streak?');
    await ui.press('Restore streak');
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    await act(async () => {
      shown('rewarded').at(-1)!.emit('rewarded_earned_reward', { amount: 1 });
      shown('rewarded').at(-1)!.emit('closed');
    });
    await flush();
    expect(ui.texts().join(' ')).toContain("Your streak is back. Play today's Daily Challenge to keep it.");
    const today = dateKeyFor(new Date(NOW));
    expect(useStreak.getState().value).toMatchObject({ lastDate: addDays(today, -1), restoredAt: addDays(today, -2) });
    await cleanup();
    const again = await render(<Home />);
    expect(again.texts().join(' ')).not.toContain('Restore your streak?'); // once per break
  });

  it('offers nothing when no day was missed or the streak was under 3', async () => {
    seasonedPlayer();
    const ui = await render(<Home />);
    expect(ui.texts().join(' ')).not.toContain('Restore your streak?');
  });

  it('grants nothing without the reward', async () => {
    brokenStreak();
    const ui = await render(<Home />);
    await ui.press('Restore streak');
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    await act(async () => shown('rewarded').at(-1)!.emit('closed'));
    await flush();
    const today = dateKeyFor(new Date(NOW));
    expect(useStreak.getState().value.lastDate).toBe(addDays(today, -2));
  });
});

describe('app-open ad on a warm start (plan §12)', () => {
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
  const opens = () => shown('appOpen');

  beforeEach(async () => {
    listeners = [];
    spy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, l: (s: string) => void) => {
      listeners.push(l);
      return { remove: () => undefined };
    }) as never);
    seasonedPlayer();
    await render(<RootLayout />);
    seasonedPlayer(); // RootLayout counts this launch
    useStats.getState().update({ sessions: 3, firstOpenAt: NOW - 10 * DAY });
    useAds.setState({ screen: 'home' });
  });
  afterEach(() => spy.mockRestore());

  it('does not show on a cold start', () => {
    expect(opens()).toHaveLength(0);
  });

  it('does not show after a short break (under 4 hours)', async () => {
    await warmStart(3 * 3_600_000);
    expect(opens()).toHaveLength(0);
  });

  it('shows after 4 hours away, then not again for 4 hours', async () => {
    await warmStart(4 * 3_600_000 + 60_000);
    const first = opens();
    expect(first).toHaveLength(1);
    await act(async () => first[0].emit('closed'));
    expect(useAdCounters.getState().value.lastAppOpenAt).toBeGreaterThan(0);
    freshAds();
    await warmStart(5 * 3_600_000); // five hours: allowed again
    expect(opens().length).toBeGreaterThanOrEqual(2);
  });

  it('does not show in the first 2 days after install, nor in the first session', async () => {
    useStats.getState().update({ firstOpenAt: Date.now() - DAY });
    await warmStart(5 * 3_600_000);
    expect(opens()).toHaveLength(0);
    useStats.getState().update({ firstOpenAt: NOW - 10 * DAY, sessions: 1 });
    await warmStart(5 * 3_600_000);
    expect(opens()).toHaveLength(0);
  });

  it('does not show while a question is on screen', async () => {
    useAds.setState({ screen: 'quiz' });
    await warmStart(5 * 3_600_000);
    expect(opens()).toHaveLength(0);
  });

  it('does not show right after a notification tap, the share sheet, or a rewarded or interstitial ad', async () => {
    useAds.getState().markExternalOpen();
    await warmStart(5 * 3_600_000 - 3_000); // the external open is recent relative to the clock
    useAds.setState({ lastExternalOpenAt: Date.now() - 2_000 });
    expect(adContext().lastExternalOpenAt).toBeGreaterThan(0);
    const { adAllowed } = require('@/domain/adRules') as typeof import('@/domain/adRules');
    expect(adAllowed('app_open', adContext())).toBe(false);
    useAds.setState({ lastExternalOpenAt: 0, lastFullScreenAt: Date.now() - 30_000 });
    expect(adAllowed('app_open', adContext())).toBe(false);
  });
});
