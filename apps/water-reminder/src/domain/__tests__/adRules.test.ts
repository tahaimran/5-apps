import { adAllowed, type AdContext, INTERSTITIALS_PER_DAY } from '../adRules';

const NOW = 1_000_000_000;
const ctx = (over: Partial<AdContext> = {}): AdContext => ({
  now: NOW,
  onboardingActive: false,
  hasLoggedGlass: true,
  launches: 10,
  lastLogAt: null,
  lastExternalOpenAt: null,
  celebrationPlaying: false,
  lastInterruptionAt: null,
  interstitialsToday: 0,
  ...over,
});

describe('plan §12 "never show" rules', () => {
  it('shows nothing during onboarding', () => {
    for (const p of ['home_under_ring', 'history_list', 'history_exit', 'app_open_warm', 'app_open']) {
      expect(adAllowed(p, ctx({ onboardingActive: true }))).toBe(false);
    }
  });

  describe('banner under the ring', () => {
    it('waits for the first glass in the first session', () => {
      expect(adAllowed('home_under_ring', ctx({ hasLoggedGlass: false }))).toBe(false);
      expect(adAllowed('home_under_ring', ctx())).toBe(true);
    });
    it('stays while a celebration plays (it never covers the plant)', () => {
      expect(adAllowed('home_under_ring', ctx({ celebrationPlaying: true }))).toBe(true);
    });
  });

  it('allows the native history ad once onboarding is done', () => {
    expect(adAllowed('history_list', ctx({ hasLoggedGlass: false }))).toBe(true);
  });

  describe('interstitial when leaving History', () => {
    it('is allowed from the third session on', () => {
      expect(adAllowed('history_exit', ctx({ launches: 2 }))).toBe(false);
      expect(adAllowed('history_exit', ctx({ launches: 3 }))).toBe(true);
    });
    it('never right after a log', () => {
      expect(adAllowed('history_exit', ctx({ lastLogAt: NOW - 30_000 }))).toBe(false);
      expect(adAllowed('history_exit', ctx({ lastLogAt: NOW - 61_000 }))).toBe(true);
    });
    it('not after a notification launch', () => {
      expect(adAllowed('history_exit', ctx({ lastExternalOpenAt: NOW - 5 * 60_000 }))).toBe(false);
      expect(adAllowed('history_exit', ctx({ lastExternalOpenAt: NOW - 31 * 60_000 }))).toBe(true);
    });
    it('not while the goal-reached celebration plays', () => {
      expect(adAllowed('history_exit', ctx({ celebrationPlaying: true }))).toBe(false);
    });
    it('at most 4 a day', () => {
      expect(adAllowed('history_exit', ctx({ interstitialsToday: INTERSTITIALS_PER_DAY - 1 }))).toBe(true);
      expect(adAllowed('history_exit', ctx({ interstitialsToday: INTERSTITIALS_PER_DAY }))).toBe(false);
    });
    it('not before any drink was logged', () => {
      expect(adAllowed('history_exit', ctx({ hasLoggedGlass: false }))).toBe(false);
    });
  });

  describe('app open on a warm start', () => {
    it.each(['app_open', 'app_open_warm'])('%s: not on the first 3 launches', (p) => {
      expect(adAllowed(p, ctx({ launches: 3 }))).toBe(false);
      expect(adAllowed(p, ctx({ launches: 4 }))).toBe(true);
    });
    it('not when opened from a reminder tap, a widget or a link (10 s window)', () => {
      expect(adAllowed('app_open_warm', ctx({ lastExternalOpenAt: NOW - 3000 }))).toBe(false);
      expect(adAllowed('app_open_warm', ctx({ lastExternalOpenAt: NOW - 11_000 }))).toBe(true);
    });
    it('not when returning from a rewarded ad or a system permission dialog', () => {
      expect(adAllowed('app_open_warm', ctx({ lastInterruptionAt: NOW - 2000 }))).toBe(false);
      expect(adAllowed('app_open_warm', ctx({ lastInterruptionAt: NOW - 20_000 }))).toBe(true);
    });
    it('not during the celebration', () => {
      expect(adAllowed('app_open_warm', ctx({ celebrationPlaying: true }))).toBe(false);
    });
  });

  it('lets unknown placements through (the shared layer has its own caps)', () => {
    expect(adAllowed('something_else', ctx())).toBe(true);
  });
});
