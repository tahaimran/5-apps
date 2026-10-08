/**
 * The app-level veto from DEVELOPMENT_PLAN.md §11 (the "Never show when" column), as pure rules.
 * @shared/ads keeps the generic caps (minimum gap, preloading, consent); this decides whether the
 * moment is right for this app. Rewarded ads are user-initiated and never come through here.
 */
export type AdScreen = 'home' | 'daily' | 'packs' | 'play' | 'complete' | 'settings' | 'other';

export type Placement = 'home_banner' | 'packs_banner' | 'level_complete' | 'app_open';

export interface AdContext {
  now: number;
  /** Setup screens and the tutorial are finished (plan §6): no ads of any kind before that. */
  setupDone: boolean;
  /** This is the very first launch of the app. */
  firstSession: boolean;
  /** Puzzles finished so far, the tutorial included. */
  puzzlesCompleted: number;
  /** The screen the player is looking at. */
  screen: AdScreen;
  /** A puzzle is open and unfinished (it may be paused in the background). */
  puzzleInProgress: boolean;
  /** Real puzzles finished since the last interstitial. */
  levelsSinceInterstitial: number;
  /** When any full-screen ad (interstitial, rewarded or app open) last closed. 0 = never. */
  lastFullScreenAt: number;
  lastRewardedAt: number;
  lastAppOpenAt: number;
  /** Start times of the interstitials of the last hour. */
  interstitialTimes: readonly number[];
  /** The puzzle on the Complete screen was the daily one (the streak moment is protected). */
  completedDaily: boolean;
  /** The app was opened by a deep link or a notification tap a moment ago (ms), or 0. */
  lastExternalOpenAt: number;
}

export interface Decision {
  allowed: boolean;
  /** Why not, in short plain English (the ad debug overlay shows these). Empty when allowed. */
  reasons: string[];
}

export const FIRST_SESSION_FREE_PUZZLES = 2; // the tutorial and level 1
export const INTERSTITIAL_EVERY_PUZZLES = 3;
export const FULL_SCREEN_GAP_MS = 90_000;
export const INTERSTITIALS_PER_HOUR = 6;
export const APP_OPEN_EVERY_MS = 4 * 60 * 60_000;
export const AFTER_EXTERNAL_OPEN_MS = 10_000;
const HOUR_MS = 60 * 60_000;

const since = (now: number, at: number) => (at > 0 ? now - at : Infinity);

/** Evaluates a placement and says why it is blocked. */
export function decide(placement: string, c: AdContext): Decision {
  const reasons: string[] = [];
  const no = (why: string) => reasons.push(why);

  // Rules for every placement.
  if (!c.setupDone) no('onboarding or the tutorial is not finished');
  if (c.firstSession && c.puzzlesCompleted < FIRST_SESSION_FREE_PUZZLES) no('first session, before level 2 is completed');

  switch (placement) {
    case 'home_banner':
      if (c.screen !== 'home') no('not the Home screen');
      break;
    case 'packs_banner':
      if (c.screen !== 'packs' && c.screen !== 'daily') no('not a pack list or the Daily tab');
      break;
    case 'level_complete': {
      if (c.screen !== 'complete') no('not on the Complete screen (never mid-puzzle or on back)');
      if (c.completedDaily) no('daily puzzle completion is ad-free');
      if (c.levelsSinceInterstitial < INTERSTITIAL_EVERY_PUZZLES) no(`only ${c.levelsSinceInterstitial} of ${INTERSTITIAL_EVERY_PUZZLES} puzzles since the last one`);
      if (since(c.now, c.lastFullScreenAt) < FULL_SCREEN_GAP_MS) no('a full-screen ad closed less than 90 s ago');
      if (since(c.now, c.lastRewardedAt) < FULL_SCREEN_GAP_MS) no('a rewarded ad closed less than 90 s ago');
      if (c.interstitialTimes.filter((t) => c.now - t < HOUR_MS).length >= INTERSTITIALS_PER_HOUR) no('6 interstitials in the last hour');
      break;
    }
    case 'app_open':
      if (c.puzzleInProgress) no('a puzzle is in progress (resume to the grid ad-free)');
      if (since(c.now, c.lastAppOpenAt) < APP_OPEN_EVERY_MS) no('an app-open ad was shown less than 4 h ago');
      if (since(c.now, c.lastFullScreenAt) < FULL_SCREEN_GAP_MS) no('a full-screen ad closed less than 90 s ago');
      if (since(c.now, c.lastExternalOpenAt) < AFTER_EXTERNAL_OPEN_MS) no('opened from a link or notification');
      break;
    default:
      no('unknown placement');
  }
  return { allowed: reasons.length === 0, reasons };
}

export const adAllowed = (placement: string, c: AdContext): boolean => decide(placement, c).allowed;

export const PLACEMENTS: Placement[] = ['home_banner', 'packs_banner', 'level_complete', 'app_open'];
