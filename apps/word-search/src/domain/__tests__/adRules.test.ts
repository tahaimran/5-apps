import {
  adAllowed,
  AFTER_EXTERNAL_OPEN_MS,
  APP_OPEN_EVERY_MS,
  decide,
  FULL_SCREEN_GAP_MS,
  INTERSTITIAL_EVERY_PUZZLES,
  INTERSTITIALS_PER_HOUR,
  PLACEMENTS,
  type AdContext,
} from '../adRules';

const NOW = 10_000_000_000;
const ctx = (over: Partial<AdContext> = {}): AdContext => ({
  now: NOW,
  setupDone: true,
  firstSession: false,
  puzzlesCompleted: 10,
  screen: 'home',
  puzzleInProgress: false,
  levelsSinceInterstitial: INTERSTITIAL_EVERY_PUZZLES,
  lastFullScreenAt: 0,
  lastRewardedAt: 0,
  lastAppOpenAt: 0,
  interstitialTimes: [],
  completedDaily: false,
  lastExternalOpenAt: 0,
  ...over,
});
const onComplete = (over: Partial<AdContext> = {}) => ctx({ screen: 'complete', ...over });

describe('every placement (plan §11 "never show when")', () => {
  it.each(PLACEMENTS)('%s is blocked during onboarding and the tutorial', (p) => {
    const screen = p === 'home_banner' ? 'home' : p === 'packs_banner' ? 'packs' : p === 'level_complete' ? 'complete' : 'home';
    expect(adAllowed(p, ctx({ screen, setupDone: false }))).toBe(false);
    expect(adAllowed(p, ctx({ screen }))).toBe(true);
  });

  it.each(PLACEMENTS)('%s is blocked in the first session until level 2 is completed', (p) => {
    const screen = p === 'home_banner' ? 'home' : p === 'packs_banner' ? 'packs' : p === 'level_complete' ? 'complete' : 'home';
    expect(adAllowed(p, ctx({ screen, firstSession: true, puzzlesCompleted: 0 }))).toBe(false);
    expect(adAllowed(p, ctx({ screen, firstSession: true, puzzlesCompleted: 1 }))).toBe(false); // the tutorial only
    expect(adAllowed(p, ctx({ screen, firstSession: true, puzzlesCompleted: 2 }))).toBe(true); // tutorial + level 1
    expect(adAllowed(p, ctx({ screen, firstSession: false, puzzlesCompleted: 0 }))).toBe(true); // a later session
  });

  it('refuses a placement it does not know', () => {
    expect(decide('mystery', ctx())).toEqual({ allowed: false, reasons: ['unknown placement'] });
  });

  it('never shows anything on the game screen, Settings, or while the screen is unknown', () => {
    for (const screen of ['play', 'settings', 'other'] as const) {
      for (const p of PLACEMENTS) if (p !== 'app_open') expect(adAllowed(p, ctx({ screen }))).toBe(false);
    }
  });
});

describe('banners', () => {
  it('home_banner only on Home', () => {
    expect(adAllowed('home_banner', ctx({ screen: 'home' }))).toBe(true);
    for (const screen of ['daily', 'packs', 'play', 'complete', 'settings'] as const) expect(adAllowed('home_banner', ctx({ screen }))).toBe(false);
  });
  it('packs_banner only on a pack list or the Daily tab', () => {
    for (const screen of ['packs', 'daily'] as const) expect(adAllowed('packs_banner', ctx({ screen }))).toBe(true);
    for (const screen of ['home', 'play', 'complete', 'settings'] as const) expect(adAllowed('packs_banner', ctx({ screen }))).toBe(false);
  });
});

describe('interstitial level_complete', () => {
  it('shows on the Complete screen after 3 puzzles', () => {
    expect(adAllowed('level_complete', onComplete())).toBe(true);
  });
  it('waits for every 3rd puzzle', () => {
    expect(adAllowed('level_complete', onComplete({ levelsSinceInterstitial: 0 }))).toBe(false);
    expect(adAllowed('level_complete', onComplete({ levelsSinceInterstitial: 2 }))).toBe(false);
    expect(adAllowed('level_complete', onComplete({ levelsSinceInterstitial: 3 }))).toBe(true);
    expect(adAllowed('level_complete', onComplete({ levelsSinceInterstitial: 7 }))).toBe(true);
  });
  it('is never shown anywhere but the Complete screen (not mid-puzzle, not on back)', () => {
    for (const screen of ['home', 'daily', 'packs', 'play', 'settings', 'other'] as const) expect(adAllowed('level_complete', ctx({ screen }))).toBe(false);
  });
  it('protects the daily puzzle completion', () => {
    expect(adAllowed('level_complete', onComplete({ completedDaily: true }))).toBe(false);
  });
  it('needs 90 s since any full-screen ad, and 90 s since a rewarded ad', () => {
    expect(adAllowed('level_complete', onComplete({ lastFullScreenAt: NOW - (FULL_SCREEN_GAP_MS - 1) }))).toBe(false);
    expect(adAllowed('level_complete', onComplete({ lastFullScreenAt: NOW - FULL_SCREEN_GAP_MS }))).toBe(true);
    expect(adAllowed('level_complete', onComplete({ lastRewardedAt: NOW - 30_000, lastFullScreenAt: NOW - 30_000 }))).toBe(false);
    expect(adAllowed('level_complete', onComplete({ lastRewardedAt: NOW - 120_000, lastFullScreenAt: NOW - 120_000 }))).toBe(true);
  });
  it('allows at most 6 interstitials in any hour', () => {
    const times = (n: number, ageMs = 600_000) => Array.from({ length: n }, (_, i) => NOW - ageMs - i * 1000);
    expect(adAllowed('level_complete', onComplete({ interstitialTimes: times(INTERSTITIALS_PER_HOUR - 1) }))).toBe(true);
    expect(adAllowed('level_complete', onComplete({ interstitialTimes: times(INTERSTITIALS_PER_HOUR) }))).toBe(false);
    expect(adAllowed('level_complete', onComplete({ interstitialTimes: times(INTERSTITIALS_PER_HOUR, 3_700_000) }))).toBe(true); // older than an hour
  });
  it('says why it said no', () => {
    const d = decide('level_complete', onComplete({ levelsSinceInterstitial: 1, completedDaily: true, lastFullScreenAt: NOW - 10_000 }));
    expect(d.allowed).toBe(false);
    expect(d.reasons.join(' | ')).toMatch(/daily/);
    expect(d.reasons.join(' | ')).toMatch(/1 of 3/);
    expect(d.reasons.join(' | ')).toMatch(/90 s/);
    expect(decide('level_complete', onComplete()).reasons).toEqual([]);
  });
});

describe('app open', () => {
  it('shows on a warm start once the rules are met', () => {
    expect(adAllowed('app_open', ctx())).toBe(true);
  });
  it('never while a puzzle is in progress', () => {
    expect(adAllowed('app_open', ctx({ puzzleInProgress: true }))).toBe(false);
  });
  it('at most once every 4 hours', () => {
    expect(adAllowed('app_open', ctx({ lastAppOpenAt: NOW - (APP_OPEN_EVERY_MS - 1) }))).toBe(false);
    expect(adAllowed('app_open', ctx({ lastAppOpenAt: NOW - APP_OPEN_EVERY_MS }))).toBe(true);
  });
  it('needs 90 s since any full-screen ad, including a rewarded one', () => {
    expect(adAllowed('app_open', ctx({ lastFullScreenAt: NOW - 60_000 }))).toBe(false);
    expect(adAllowed('app_open', ctx({ lastFullScreenAt: NOW - 100_000 }))).toBe(true);
  });
  it('not right after opening from a link or a notification', () => {
    expect(adAllowed('app_open', ctx({ lastExternalOpenAt: NOW - (AFTER_EXTERNAL_OPEN_MS - 1) }))).toBe(false);
    expect(adAllowed('app_open', ctx({ lastExternalOpenAt: NOW - AFTER_EXTERNAL_OPEN_MS }))).toBe(true);
  });
  it('can show on any screen that is not a puzzle (a warm start returns to wherever the player was)', () => {
    for (const screen of ['home', 'daily', 'packs', 'complete', 'settings', 'other'] as const) expect(adAllowed('app_open', ctx({ screen }))).toBe(true);
  });
});
