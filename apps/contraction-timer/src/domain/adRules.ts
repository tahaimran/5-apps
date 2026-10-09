/**
 * The app-level veto for ads, DEVELOPMENT_PLAN.md §12 ("Never show when") as pure rules that say why not.
 * @shared/ads keeps the generic caps (minimum gap, preloading, consent); this decides whether the moment is right
 * for this app.
 *
 * One rule is stricter than the plan and overrides it: while a contraction session or a kick count is open (running
 * *or* resting between contractions) nothing is shown at all: no banner, native card, interstitial or app-open ad, and
 * the rewarded buttons are off ("Available after your session"). The plan only forbade the full-screen formats and the
 * screens around the button; for something used in labour the safer rule is none.
 */
import { HOUR, MINUTE, SECOND } from './defaults';
import type { DateKey } from './types';
import { dayDiff } from './dateKey';

export type AdScreen = 'timer' | 'timerHistory' | 'session' | 'kicks' | 'kickHistory' | 'weeks' | 'weekArticle' | 'checklist' | 'onboarding' | 'other';

export type Placement =
  | 'history_banner'
  | 'week_banner'
  | 'checklist_banner'
  | 'week_native'
  | 'week_close_interstitial'
  | 'app_open'
  | 'pdf_theme_reward'
  | 'checklist_template_reward';

export const PLACEMENTS: Placement[] = ['history_banner', 'week_banner', 'checklist_banner', 'week_native', 'week_close_interstitial', 'app_open', 'pdf_theme_reward', 'checklist_template_reward'];
export const REWARDED_PLACEMENTS: Placement[] = ['pdf_theme_reward', 'checklist_template_reward'];

export interface AdContext {
  now: number;
  /** Onboarding is finished and the disclaimer was acknowledged. */
  setupDone: boolean;
  /** Cold starts so far, this one included. */
  launches: number;
  installDay: DateKey;
  today: DateKey;
  screen: AdScreen;
  keyboardOpen: boolean;
  /** A contraction session is open (a contraction is running, or it is resting between them). */
  sessionOpen: boolean;
  /** A kick count is open. */
  kickOpen: boolean;
  partnerMode: boolean;
  /** When the last contraction session ended (0 = never). */
  lastSessionEndedAt: number;
  /** When any full-screen ad last closed (0 = never). */
  lastFullScreenAt: number;
  lastAppOpenAt: number;
  /** Interstitials shown today, and the day that count is for. */
  interstitialsToday: number;
  interstitialsDay: DateKey;
  /** The app was opened from a notification or a link at this time (0 = not). */
  lastExternalOpenAt: number;
  /** A week article was just closed after this many milliseconds of reading, at `closedAt` (0 = none). */
  articleClosedAt: number;
  articleReadMs: number;
}

export interface Decision {
  allowed: boolean;
  /** Why not, in short plain English (the debug screen shows these). Empty when allowed. */
  reasons: string[];
}

export const INTERSTITIAL_MIN_READ_MS = 20 * SECOND;
export const INTERSTITIAL_GAP_MS = 3 * MINUTE;
export const INTERSTITIALS_PER_DAY = 4;
export const AFTER_SESSION_INTERSTITIAL_MS = 2 * MINUTE;
export const AFTER_SESSION_APP_OPEN_MS = 30 * MINUTE;
export const APP_OPEN_EVERY_MS = 4 * HOUR;
export const APP_OPEN_MIN_DAY = 2;
export const APP_OPEN_MIN_LAUNCHES = 4; // "not on the first 3 launches"
export const AFTER_EXTERNAL_OPEN_MS = 10 * SECOND;
export const CLOSE_WINDOW_MS = 5 * SECOND;
const FULL_SCREEN_GAP_MS = 90 * SECOND;

const since = (now: number, at: number) => (at > 0 ? now - at : Infinity);

const BANNER_SCREENS: Record<'history_banner' | 'week_banner' | 'checklist_banner' | 'week_native', AdScreen[]> = {
  history_banner: ['timerHistory', 'kickHistory'],
  week_banner: ['weeks', 'weekArticle'],
  checklist_banner: ['checklist'],
  week_native: ['weeks'],
};

/** Evaluates a placement and says why it is blocked. Rewarded placements are decided by `decideRewarded`. */
export function decide(placement: string, c: AdContext): Decision {
  const reasons: string[] = [];
  const no = (why: string) => reasons.push(why);

  if (!c.setupDone) no('onboarding or the disclaimer is not finished');
  if (c.sessionOpen) no('a contraction session is open');
  if (c.kickOpen) no('a kick count is open');
  if (c.screen === 'timer' || c.screen === 'kicks' || c.screen === 'onboarding') no('the Timer, Kicks and onboarding screens never show ads');

  switch (placement) {
    case 'history_banner':
    case 'week_banner':
    case 'week_native':
      if (!BANNER_SCREENS[placement].includes(c.screen)) no(`not on ${placement === 'history_banner' ? 'a history list' : 'the week list or a week article'}`);
      break;
    case 'checklist_banner':
      if (c.screen !== 'checklist') no('not on a checklist');
      if (c.keyboardOpen) no('the keyboard is open');
      break;
    case 'week_close_interstitial': {
      if (dayDiff(c.installDay, c.today) < 1) no('install day (day 0)');
      if (c.launches <= 1) no('first launch of the app');
      if (c.partnerMode) no('Partner mode is on');
      if (since(c.now, c.lastSessionEndedAt) < AFTER_SESSION_INTERSTITIAL_MS) no('a contraction session ended less than 2 minutes ago');
      if (since(c.now, c.lastFullScreenAt) < INTERSTITIAL_GAP_MS) no('a full-screen ad closed less than 3 minutes ago');
      const today = c.interstitialsDay === c.today ? c.interstitialsToday : 0;
      if (today >= INTERSTITIALS_PER_DAY) no(`${INTERSTITIALS_PER_DAY} interstitials already today`);
      if (!(c.articleClosedAt > 0 && c.now - c.articleClosedAt <= CLOSE_WINDOW_MS)) no('not right after closing a week article');
      else if (c.articleReadMs < INTERSTITIAL_MIN_READ_MS) no('the article was read for less than 20 seconds');
      break;
    }
    case 'app_open':
      if (dayDiff(c.installDay, c.today) < APP_OPEN_MIN_DAY) no('not before day 2');
      if (c.launches < APP_OPEN_MIN_LAUNCHES) no('one of the first 3 launches');
      if (c.partnerMode) no('Partner mode is on');
      if (since(c.now, c.lastSessionEndedAt) < AFTER_SESSION_APP_OPEN_MS) no('a contraction session ended less than 30 minutes ago');
      if (since(c.now, c.lastAppOpenAt) < APP_OPEN_EVERY_MS) no('an app-open ad was shown less than 4 hours ago');
      if (since(c.now, c.lastFullScreenAt) < FULL_SCREEN_GAP_MS) no('a full-screen ad closed less than 90 seconds ago');
      if (since(c.now, c.lastExternalOpenAt) < AFTER_EXTERNAL_OPEN_MS) no('opened from a notification or a link');
      break;
    default:
      no('unknown placement');
  }
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Rewarded ads are asked for by the person (@shared/ads does not run the veto for them), so the button itself must
 * check this: off during a session or kick count ("Available after your session").
 */
export function decideRewarded(placement: string, c: AdContext): Decision {
  const reasons: string[] = [];
  if (!REWARDED_PLACEMENTS.includes(placement as Placement)) reasons.push('unknown placement');
  if (!c.setupDone) reasons.push('onboarding or the disclaimer is not finished');
  if (c.sessionOpen) reasons.push('a contraction session is open');
  if (c.kickOpen) reasons.push('a kick count is open');
  return { allowed: reasons.length === 0, reasons };
}

export const adAllowed = (placement: string, c: AdContext): boolean => decide(placement, c).allowed;
export const rewardedAllowed = (placement: string, c: AdContext): boolean => decideRewarded(placement, c).allowed;

