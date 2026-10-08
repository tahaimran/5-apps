import { adAllowed, type AdContext } from '../adRules';

const NOW = 10_000_000;
const ctx = (over: Partial<AdContext> = {}): AdContext => ({
  now: NOW,
  onboardingDone: true,
  hasCheckedIn: true,
  habitCount: 4,
  openDays: 3,
  appForegroundAt: NOW - 120_000,
  lastCheckInAt: NOW - 60_000,
  lastRewardedAt: null,
  lastExternalOpenAt: null,
  ...over,
});

describe('global rules', () => {
  it.each(['today_bottom', 'stats_list', 'leave_stats', 'after_edit', 'app_open_warm'])('%s is allowed in a normal session', (p) => {
    expect(adAllowed(p, ctx())).toBe(true);
  });
  it.each(['today_bottom', 'stats_list', 'leave_stats', 'after_edit', 'app_open_warm'])('%s never shows during onboarding', (p) => {
    expect(adAllowed(p, ctx({ onboardingDone: false }))).toBe(false);
  });
  it.each(['today_bottom', 'leave_stats', 'app_open_warm'])('%s waits for the first check-in', (p) => {
    expect(adAllowed(p, ctx({ hasCheckedIn: false }))).toBe(false);
  });
  it('lets unknown placements through once past the global rules', () => {
    expect(adAllowed('something_else', ctx())).toBe(true);
  });
});

describe('native ad', () => {
  it('needs at least 3 habits', () => {
    expect(adAllowed('stats_list', ctx({ habitCount: 2 }))).toBe(false);
    expect(adAllowed('stats_list', ctx({ habitCount: 3 }))).toBe(true);
  });
});

describe('interstitials', () => {
  it.each(['leave_stats', 'after_edit'])('%s waits 30 s after the app opens', (p) => {
    expect(adAllowed(p, ctx({ appForegroundAt: NOW - 29_000 }))).toBe(false);
    expect(adAllowed(p, ctx({ appForegroundAt: NOW - 30_000 }))).toBe(true);
  });
  it.each(['leave_stats', 'after_edit'])('%s is not shown right after a check-in', (p) => {
    expect(adAllowed(p, ctx({ lastCheckInAt: NOW - 5_000 }))).toBe(false);
    expect(adAllowed(p, ctx({ lastCheckInAt: NOW - 10_000 }))).toBe(true);
  });
  it.each(['leave_stats', 'after_edit'])('%s is held back for 3 minutes after a rewarded ad', (p) => {
    expect(adAllowed(p, ctx({ lastRewardedAt: NOW - 170_000 }))).toBe(false);
    expect(adAllowed(p, ctx({ lastRewardedAt: NOW - 181_000 }))).toBe(true);
  });
});

describe('app open', () => {
  it('only after the second distinct day', () => {
    expect(adAllowed('app_open_warm', ctx({ openDays: 1 }))).toBe(false);
    expect(adAllowed('app_open_warm', ctx({ openDays: 2 }))).toBe(true);
  });
  it('not when launched from a notification or the widget', () => {
    expect(adAllowed('app_open_warm', ctx({ lastExternalOpenAt: NOW - 3_000 }))).toBe(false);
    expect(adAllowed('app_open_warm', ctx({ lastExternalOpenAt: NOW - 20_000 }))).toBe(true);
  });
});
