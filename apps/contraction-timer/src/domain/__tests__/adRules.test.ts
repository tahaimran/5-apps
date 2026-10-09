import { adAllowed, AFTER_EXTERNAL_OPEN_MS, APP_OPEN_EVERY_MS, decide, decideRewarded, INTERSTITIAL_GAP_MS, INTERSTITIAL_MIN_READ_MS, PLACEMENTS, REWARDED_PLACEMENTS, rewardedAllowed, type AdContext } from '../adRules';
import { MINUTE, SECOND } from '../defaults';

const NOW = new Date(2026, 10, 10, 12, 0).getTime(); // 10 Nov 2026
const ctx = (over: Partial<AdContext> = {}): AdContext => ({
  now: NOW,
  setupDone: true,
  launches: 9,
  installDay: '2026-11-01',
  today: '2026-11-10',
  screen: 'other',
  keyboardOpen: false,
  sessionOpen: false,
  kickOpen: false,
  partnerMode: false,
  lastSessionEndedAt: 0,
  lastFullScreenAt: 0,
  lastAppOpenAt: 0,
  interstitialsToday: 0,
  interstitialsDay: '2026-11-10',
  lastExternalOpenAt: 0,
  articleClosedAt: NOW - SECOND,
  articleReadMs: 30 * SECOND,
  ...over,
});
const why = (placement: string, over: Partial<AdContext> = {}) => decide(placement, ctx(over)).reasons.join(' | ');

describe('every placement of plan §12 has a rule', () => {
  it('lists the eight placement ids, and refuses unknown ones', () => {
    expect([...PLACEMENTS].sort()).toEqual(['app_open', 'checklist_banner', 'checklist_template_reward', 'history_banner', 'pdf_theme_reward', 'week_banner', 'week_close_interstitial', 'week_native']);
    expect(why('nope')).toContain('unknown placement');
  });
});

describe('while a session is open nothing is shown (stricter than the plan)', () => {
  const screens = { history_banner: 'timerHistory', week_banner: 'weeks', checklist_banner: 'checklist', week_native: 'weeks', week_close_interstitial: 'weekArticle', app_open: 'other' } as const;
  it.each(Object.entries(screens))('%s is blocked by an open contraction session', (placement, screen) => {
    expect(adAllowed(placement, ctx({ screen }))).toBe(true);
    expect(why(placement, { screen, sessionOpen: true })).toContain('a contraction session is open');
  });
  it.each(Object.entries(screens))('%s is blocked by an open kick count', (placement, screen) => {
    expect(why(placement, { screen, kickOpen: true })).toContain('a kick count is open');
  });
  it('rewarded buttons are off then ("Available after your session")', () => {
    for (const p of REWARDED_PLACEMENTS) {
      expect(rewardedAllowed(p, ctx())).toBe(true);
      expect(decideRewarded(p, ctx({ sessionOpen: true })).reasons).toContain('a contraction session is open');
      expect(decideRewarded(p, ctx({ kickOpen: true })).reasons).toContain('a kick count is open');
    }
    expect(decideRewarded('nope', ctx()).allowed).toBe(false);
  });
  it('everything is blocked before onboarding and the disclaimer are done', () => {
    for (const p of PLACEMENTS) expect(decide(p, ctx({ setupDone: false })).allowed).toBe(false);
  });
});

describe('the Timer, Kicks and onboarding screens never show ads', () => {
  it.each(['timer', 'kicks', 'onboarding'] as const)('%s', (screen) => {
    for (const p of PLACEMENTS.filter((x) => !REWARDED_PLACEMENTS.includes(x))) expect(decide(p, ctx({ screen })).allowed).toBe(false);
  });
  it('a session detail never has a banner either', () => {
    for (const p of ['history_banner', 'week_banner', 'checklist_banner', 'week_native']) expect(adAllowed(p, ctx({ screen: 'session' }))).toBe(false);
  });
});

describe('banners (plan §12)', () => {
  it('the history banner is on the contraction and kick history lists only', () => {
    expect(adAllowed('history_banner', ctx({ screen: 'timerHistory' }))).toBe(true);
    expect(adAllowed('history_banner', ctx({ screen: 'kickHistory' }))).toBe(true);
    expect(adAllowed('history_banner', ctx({ screen: 'weeks' }))).toBe(false);
  });
  it('the week banner is on the week list and a week article only', () => {
    expect(adAllowed('week_banner', ctx({ screen: 'weeks' }))).toBe(true);
    expect(adAllowed('week_banner', ctx({ screen: 'weekArticle' }))).toBe(true);
    expect(adAllowed('week_banner', ctx({ screen: 'checklist' }))).toBe(false);
  });
  it('the checklist banner hides while the keyboard is open', () => {
    expect(adAllowed('checklist_banner', ctx({ screen: 'checklist' }))).toBe(true);
    expect(why('checklist_banner', { screen: 'checklist', keyboardOpen: true })).toContain('the keyboard is open');
  });
  it('the native card is on the week list only', () => {
    expect(adAllowed('week_native', ctx({ screen: 'weeks' }))).toBe(true);
    expect(adAllowed('week_native', ctx({ screen: 'weekArticle' }))).toBe(false);
  });
});

describe('the interstitial on closing a week article (plan §12)', () => {
  const ok = (over: Partial<AdContext> = {}) => decide('week_close_interstitial', ctx({ screen: 'weekArticle', ...over }));
  it('is allowed after a 20-second read on an ordinary day', () => {
    expect(ok().allowed).toBe(true);
  });
  it('needs the read to be 20 seconds or more, and to be right after closing', () => {
    expect(ok({ articleReadMs: INTERSTITIAL_MIN_READ_MS - 1 }).reasons).toContain('the article was read for less than 20 seconds');
    expect(ok({ articleReadMs: INTERSTITIAL_MIN_READ_MS }).allowed).toBe(true);
    expect(ok({ articleClosedAt: NOW - 6 * SECOND }).reasons).toContain('not right after closing a week article');
    expect(ok({ articleClosedAt: 0 }).allowed).toBe(false);
  });
  it('never on install day, and not on the first launch', () => {
    expect(ok({ today: '2026-11-01' }).reasons).toContain('install day (day 0)');
    expect(ok({ launches: 1 }).reasons).toContain('first launch of the app');
    expect(ok({ today: '2026-11-02' }).allowed).toBe(true);
  });
  it('not in Partner mode', () => {
    expect(ok({ partnerMode: true }).reasons).toContain('Partner mode is on');
  });
  it('not within 2 minutes of a contraction session ending, fine after', () => {
    expect(ok({ lastSessionEndedAt: NOW - 2 * MINUTE + 1 }).reasons).toContain('a contraction session ended less than 2 minutes ago');
    expect(ok({ lastSessionEndedAt: NOW - 2 * MINUTE }).allowed).toBe(true);
  });
  it('at least 3 minutes after any full-screen ad', () => {
    expect(ok({ lastFullScreenAt: NOW - INTERSTITIAL_GAP_MS + 1 }).reasons).toContain('a full-screen ad closed less than 3 minutes ago');
    expect(ok({ lastFullScreenAt: NOW - INTERSTITIAL_GAP_MS }).allowed).toBe(true);
  });
  it('at most 4 a day, counted for today only', () => {
    expect(ok({ interstitialsToday: 4 }).reasons).toContain('4 interstitials already today');
    expect(ok({ interstitialsToday: 3 }).allowed).toBe(true);
    expect(ok({ interstitialsToday: 9, interstitialsDay: '2026-11-09' }).allowed).toBe(true);
  });
});

describe('the app-open ad (plan §12)', () => {
  const ok = (over: Partial<AdContext> = {}) => decide('app_open', ctx(over));
  it('is allowed on a seasoned launch after a long break', () => {
    expect(ok().allowed).toBe(true);
  });
  it('not before day 2, and not in the first 3 launches', () => {
    expect(ok({ today: '2026-11-02' }).reasons).toContain('not before day 2');
    expect(ok({ today: '2026-11-03' }).allowed).toBe(true);
    expect(ok({ launches: 3 }).reasons).toContain('one of the first 3 launches');
    expect(ok({ launches: 4 }).allowed).toBe(true);
  });
  it('not within 30 minutes of a session ending, and not once an hour', () => {
    expect(ok({ lastSessionEndedAt: NOW - 30 * MINUTE + 1 }).reasons).toContain('a contraction session ended less than 30 minutes ago');
    expect(ok({ lastSessionEndedAt: NOW - 30 * MINUTE }).allowed).toBe(true);
    expect(ok({ lastAppOpenAt: NOW - APP_OPEN_EVERY_MS + 1 }).reasons).toContain('an app-open ad was shown less than 4 hours ago');
    expect(ok({ lastAppOpenAt: NOW - APP_OPEN_EVERY_MS }).allowed).toBe(true);
  });
  it('not when the app was opened from a notification or a link', () => {
    expect(ok({ lastExternalOpenAt: NOW - AFTER_EXTERNAL_OPEN_MS + 1 }).reasons).toContain('opened from a notification or a link');
    expect(ok({ lastExternalOpenAt: NOW - AFTER_EXTERNAL_OPEN_MS }).allowed).toBe(true);
  });
  it('not in Partner mode, and not right after another full-screen ad', () => {
    expect(ok({ partnerMode: true }).allowed).toBe(false);
    expect(ok({ lastFullScreenAt: NOW - 89 * SECOND }).reasons).toContain('a full-screen ad closed less than 90 seconds ago');
  });
});

describe('the day boundaries use calendar days, not 24-hour spans', () => {
  it('"day 2" is two calendar days after install, however late the install was', () => {
    expect(adAllowed('app_open', ctx({ installDay: '2026-11-08', today: '2026-11-10' }))).toBe(true);
    expect(adAllowed('app_open', ctx({ installDay: '2026-11-09', today: '2026-11-10' }))).toBe(false);
  });
});
