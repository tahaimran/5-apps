/**
 * The app-level veto from DEVELOPMENT_PLAN.md §12 (the "Never show when" column) as pure rules that
 * return reasons. @shared/ads keeps the generic caps (minimum gap, preloading, consent); this decides
 * whether the moment is right for Quizora. Nothing here ever allows an ad on the question screen.
 */
export type AdScreen = 'home' | 'play' | 'classic' | 'stats' | 'settings' | 'quiz' | 'results' | 'dailyResult' | 'onboarding' | 'other';

export type Placement = 'menu' | 'round_end' | 'app_open' | 'results_native';
export type RewardedPlacement = 'lifeline' | 'extra_life' | 'double_xp' | 'streak_restore';

export interface AdContext {
  now: number;
  /** Local date `YYYY-MM-DD` right now. */
  today: string;
  /** The whole first-run path is finished (plan §6). */
  onboardingDone: boolean;
  /** This is the very first launch of the app. */
  firstSession: boolean;
  /** Ms since this app process started. */
  sessionAgeMs: number;
  /** Ms since the app was first opened. */
  installAgeMs: number;
  screen: AdScreen;
  /** Rounds finished since the last interstitial (warm-ups do not count). */
  roundsSinceInterstitial: number;
  /** When any full-screen ad (interstitial, rewarded or app open) last closed. 0 = never. */
  lastFullScreenAt: number;
  lastRewardedAt: number;
  lastAppOpenAt: number;
  interstitialsToday: number;
  /** The app was opened by a notification tap, a link, or came back from the share sheet a moment ago (ms), or 0. */
  lastExternalOpenAt: number;
}

export interface Decision {
  allowed: boolean;
  /** Why not, in short plain English (the ad debug screen shows these). Empty when allowed. */
  reasons: string[];
}

export const INTERSTITIAL_EVERY_ROUNDS = 2;
export const FULL_SCREEN_GAP_MS = 90_000;
export const INTERSTITIALS_PER_DAY = 8;
export const MIN_SESSION_AGE_MS = 60_000;
export const APP_OPEN_EVERY_MS = 4 * 60 * 60_000;
export const APP_OPEN_AFTER_INSTALL_MS = 2 * 86_400_000;
export const AFTER_EXTERNAL_OPEN_MS = 10_000;
export const LIFELINE_VIDEOS_PER_DAY = 15;
export const DOUBLE_XP_PER_DAY = 3;

export const MENU_SCREENS: readonly AdScreen[] = ['home', 'play', 'classic', 'stats', 'settings'];

const since = (now: number, at: number) => (at > 0 ? now - at : Infinity);

/** Evaluates a placement and says why it is blocked. */
export function decide(placement: string, c: AdContext): Decision {
  const reasons: string[] = [];
  const no = (why: string) => reasons.push(why);

  // Rules for every placement.
  if (!c.onboardingDone) no('onboarding is not finished');
  if (c.screen === 'quiz') no('a question is on screen (never mid-question)');

  switch (placement) {
    case 'menu':
      if (!MENU_SCREENS.includes(c.screen)) no('not a menu screen (Home, Play, Classic, Stats, Settings)');
      break;
    case 'round_end':
      if (c.screen !== 'results') no('not on the Results screen (only between rounds)');
      if (c.firstSession) no('first session');
      if (c.sessionAgeMs < MIN_SESSION_AGE_MS) no('less than 60 s into the session');
      if (c.roundsSinceInterstitial < INTERSTITIAL_EVERY_ROUNDS) no(`only ${c.roundsSinceInterstitial} of ${INTERSTITIAL_EVERY_ROUNDS} rounds since the last one`);
      if (since(c.now, c.lastFullScreenAt) < FULL_SCREEN_GAP_MS) no('a full-screen ad closed less than 90 s ago');
      if (since(c.now, c.lastRewardedAt) < FULL_SCREEN_GAP_MS) no('a rewarded ad closed less than 90 s ago');
      if (c.interstitialsToday >= INTERSTITIALS_PER_DAY) no('8 interstitials already today');
      break;
    case 'app_open':
      if (c.firstSession) no('first session');
      if (c.installAgeMs < APP_OPEN_AFTER_INSTALL_MS) no('first 2 days after install');
      if (since(c.now, c.lastAppOpenAt) < APP_OPEN_EVERY_MS) no('an app-open ad was shown less than 4 h ago');
      if (since(c.now, c.lastFullScreenAt) < FULL_SCREEN_GAP_MS) no('a full-screen ad closed less than 90 s ago');
      if (since(c.now, c.lastExternalOpenAt) < AFTER_EXTERNAL_OPEN_MS) no('opened from a notification, a link or the share sheet');
      break;
    case 'results_native':
      if (c.screen !== 'results') no('not on the Results screen (no ads on the Daily result or in onboarding)');
      break;
    default:
      no('unknown placement');
  }
  return { allowed: reasons.length === 0, reasons };
}

export const adAllowed = (placement: string, c: AdContext): boolean => decide(placement, c).allowed;

export const PLACEMENTS: Placement[] = ['menu', 'round_end', 'app_open', 'results_native'];

export interface RewardedContext {
  today: string;
  screen: AdScreen;
  onboardingDone: boolean;
  /** Lifeline videos watched today. */
  lifelineVideosToday: number;
  /** Double XP used today (plan: max 3). */
  doubleXpToday: number;
  /** The round being offered a bonus: its correct answers (Double XP is not offered at score 0). */
  correct?: number;
  /** The result was already doubled. */
  alreadyDoubled?: boolean;
  /** Rounds in which the heart continue was already used (once per level attempt). */
  heartContinueUsed?: boolean;
  /** The streak can be restored right now (see domain/streak.ts). */
  canRestore?: boolean;
}

/** Whether a rewarded offer may be shown: user-started, but with the plan's daily and per-round limits. */
export function rewardedDecision(placement: RewardedPlacement, c: RewardedContext): Decision {
  const reasons: string[] = [];
  const no = (why: string) => reasons.push(why);
  if (!c.onboardingDone) no('onboarding is not finished');
  switch (placement) {
    case 'lifeline':
      if (c.lifelineVideosToday >= LIFELINE_VIDEOS_PER_DAY) no('15 lifeline videos already today');
      break;
    case 'extra_life':
      if (c.heartContinueUsed) no('the continue was already used on this level attempt');
      break;
    case 'double_xp':
      if ((c.correct ?? 0) <= 0) no('a score of 0 earns no XP to double');
      if (c.alreadyDoubled) no('already doubled');
      if (c.doubleXpToday >= DOUBLE_XP_PER_DAY) no('3 Double XP videos already today');
      break;
    case 'streak_restore':
      if (!c.canRestore) no('no single missed day to restore');
      break;
  }
  return { allowed: reasons.length === 0, reasons };
}
