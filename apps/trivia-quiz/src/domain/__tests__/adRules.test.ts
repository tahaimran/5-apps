import { adAllowed, APP_OPEN_AFTER_INSTALL_MS, decide, INTERSTITIALS_PER_DAY, rewardedDecision, type AdContext, type RewardedContext } from '../adRules';

const NOW = 1_800_000_000_000;
const base: AdContext = {
  now: NOW,
  today: '2026-10-08',
  onboardingDone: true,
  firstSession: false,
  sessionAgeMs: 10 * 60_000,
  installAgeMs: 10 * 86_400_000,
  screen: 'results',
  roundsSinceInterstitial: 2,
  lastFullScreenAt: 0,
  lastRewardedAt: 0,
  lastAppOpenAt: 0,
  interstitialsToday: 0,
  lastExternalOpenAt: 0,
};
const ctx = (over: Partial<AdContext> = {}): AdContext => ({ ...base, ...over });

describe('interstitial between rounds (round_end)', () => {
  it('shows after every 2 completed rounds on the Results screen', () => {
    expect(decide('round_end', ctx()).allowed).toBe(true);
    expect(decide('round_end', ctx({ roundsSinceInterstitial: 1 })).reasons.join()).toMatch(/1 of 2 rounds/);
    expect(adAllowed('round_end', ctx({ roundsSinceInterstitial: 5 }))).toBe(true);
  });
  it('never shows during a question or anywhere but the Results screen', () => {
    for (const screen of ['quiz', 'home', 'dailyResult', 'onboarding', 'play', 'other'] as const) expect(adAllowed('round_end', ctx({ screen }))).toBe(false);
    expect(decide('round_end', ctx({ screen: 'quiz' })).reasons.join()).toMatch(/never mid-question/);
  });
  it('never shows in the first session, before onboarding ends, or in the first 60 s', () => {
    expect(adAllowed('round_end', ctx({ firstSession: true }))).toBe(false);
    expect(adAllowed('round_end', ctx({ onboardingDone: false }))).toBe(false);
    expect(adAllowed('round_end', ctx({ sessionAgeMs: 59_999 }))).toBe(false);
    expect(adAllowed('round_end', ctx({ sessionAgeMs: 60_000 }))).toBe(true);
  });
  it('needs 90 s since any full-screen ad, and right after a rewarded ad is blocked', () => {
    expect(adAllowed('round_end', ctx({ lastFullScreenAt: NOW - 89_000 }))).toBe(false);
    expect(adAllowed('round_end', ctx({ lastFullScreenAt: NOW - 90_000 }))).toBe(true);
    expect(adAllowed('round_end', ctx({ lastRewardedAt: NOW - 30_000, lastFullScreenAt: 0 }))).toBe(false);
  });
  it('stops at 8 a day', () => {
    expect(adAllowed('round_end', ctx({ interstitialsToday: INTERSTITIALS_PER_DAY - 1 }))).toBe(true);
    expect(decide('round_end', ctx({ interstitialsToday: INTERSTITIALS_PER_DAY })).reasons.join()).toMatch(/8 interstitials/);
  });
});

describe('app open', () => {
  const warm = (over: Partial<AdContext> = {}) => ctx({ screen: 'home', ...over });
  it('allows a warm start on a menu screen after the first 2 days', () => {
    expect(adAllowed('app_open', warm())).toBe(true);
  });
  it('is blocked in the first 2 days after install and in the first session', () => {
    expect(adAllowed('app_open', warm({ installAgeMs: APP_OPEN_AFTER_INSTALL_MS - 1 }))).toBe(false);
    expect(adAllowed('app_open', warm({ firstSession: true }))).toBe(false);
  });
  it('is limited to one every 4 hours', () => {
    expect(adAllowed('app_open', warm({ lastAppOpenAt: NOW - 3 * 3_600_000 }))).toBe(false);
    expect(adAllowed('app_open', warm({ lastAppOpenAt: NOW - 4 * 3_600_000 }))).toBe(true);
  });
  it('is blocked on return from a rewarded or interstitial ad, a notification, a link or the share sheet', () => {
    expect(adAllowed('app_open', warm({ lastFullScreenAt: NOW - 20_000 }))).toBe(false);
    expect(adAllowed('app_open', warm({ lastExternalOpenAt: NOW - 3_000 }))).toBe(false);
    expect(adAllowed('app_open', warm({ lastExternalOpenAt: NOW - 11_000 }))).toBe(true);
  });
  it('is never shown over a question', () => {
    expect(adAllowed('app_open', ctx({ screen: 'quiz' }))).toBe(false);
  });
});

describe('banner and native', () => {
  it('shows the banner on Home, Play, Classic, Stats and Settings only', () => {
    for (const screen of ['home', 'play', 'classic', 'stats', 'settings'] as const) expect(adAllowed('menu', ctx({ screen }))).toBe(true);
    for (const screen of ['quiz', 'results', 'dailyResult', 'onboarding', 'other'] as const) expect(adAllowed('menu', ctx({ screen }))).toBe(false);
  });
  it('shows no banner in onboarding even on a menu screen', () => {
    expect(adAllowed('menu', ctx({ screen: 'home', onboardingDone: false }))).toBe(false);
  });
  it('shows the native card on Results only, never on the Daily result or in onboarding', () => {
    expect(adAllowed('results_native', ctx())).toBe(true);
    expect(adAllowed('results_native', ctx({ screen: 'dailyResult' }))).toBe(false);
    expect(adAllowed('results_native', ctx({ onboardingDone: false }))).toBe(false);
  });
  it('rejects a placement it does not know', () => {
    expect(decide('nope', ctx()).reasons).toContain('unknown placement');
  });
  it('lists a reason for every block', () => {
    const d = decide('round_end', ctx({ screen: 'home', firstSession: true }));
    expect(d.allowed).toBe(false);
    expect(d.reasons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('rewarded offers', () => {
  const rc = (over: Partial<RewardedContext> = {}): RewardedContext => ({ today: '2026-10-08', screen: 'quiz', onboardingDone: true, lifelineVideosToday: 0, doubleXpToday: 0, ...over });
  it('caps lifeline videos at 15 a day', () => {
    expect(rewardedDecision('lifeline', rc({ lifelineVideosToday: 14 })).allowed).toBe(true);
    expect(rewardedDecision('lifeline', rc({ lifelineVideosToday: 15 })).allowed).toBe(false);
  });
  it('offers the heart continue once per level attempt', () => {
    expect(rewardedDecision('extra_life', rc()).allowed).toBe(true);
    expect(rewardedDecision('extra_life', rc({ heartContinueUsed: true })).allowed).toBe(false);
  });
  it('offers Double XP 3 times a day, never at a score of 0, never twice on one result', () => {
    expect(rewardedDecision('double_xp', rc({ correct: 4 })).allowed).toBe(true);
    expect(rewardedDecision('double_xp', rc({ correct: 0 })).allowed).toBe(false);
    expect(rewardedDecision('double_xp', rc({ correct: 4, doubleXpToday: 3 })).allowed).toBe(false);
    expect(rewardedDecision('double_xp', rc({ correct: 4, alreadyDoubled: true })).allowed).toBe(false);
  });
  it('offers the streak restore only when it can be restored', () => {
    expect(rewardedDecision('streak_restore', rc({ canRestore: true })).allowed).toBe(true);
    expect(rewardedDecision('streak_restore', rc()).allowed).toBe(false);
  });
  it('never offers anything before onboarding ends', () => {
    expect(rewardedDecision('lifeline', rc({ onboardingDone: false })).allowed).toBe(false);
  });
});
