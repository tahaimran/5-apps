export interface AdContext {
  now: number;
  /** Onboarding has not finished: no ads at all. */
  onboardingActive: boolean;
  /** At least one drink has ever been logged (the first-value moment). */
  hasLoggedGlass: boolean;
  /** Cold starts so far, including this one. */
  launches: number;
  /** Last drink logged in this session (ms), if any. */
  lastLogAt: number | null;
  /** Last launch from a reminder tap, deep link or widget (ms). */
  lastExternalOpenAt: number | null;
  /** The goal-reached confetti is on screen. */
  celebrationPlaying: boolean;
  /** Last rewarded ad or system permission dialog closed (ms): the app was just in front of the user's face. */
  lastInterruptionAt: number | null;
  /** Interstitials shown today. */
  interstitialsToday: number;
}

export const INTERSTITIAL_MIN_LAUNCHES = 3; // not in the first 2 sessions
export const APP_OPEN_MIN_LAUNCHES = 4; // not on the first 3 launches
export const INTERSTITIAL_AFTER_LOG_MS = 60_000;
export const INTERSTITIAL_AFTER_EXTERNAL_MS = 30 * 60_000;
export const APP_OPEN_AFTER_EXTERNAL_MS = 10_000;
export const AFTER_INTERRUPTION_MS = 10_000;
export const INTERSTITIALS_PER_DAY = 4;

const within = (now: number, at: number | null, ms: number) => at !== null && now - at < ms;

/**
 * The app-level veto from DEVELOPMENT_PLAN.md §12 ("Never show" column). Frequency caps live in
 * @shared/ads; this decides whether the moment is right. Rewarded ads are user-initiated and
 * never pass through here.
 */
export function adAllowed(placement: string, c: AdContext): boolean {
  if (c.onboardingActive) return false;
  switch (placement) {
    case 'home_under_ring':
      return c.hasLoggedGlass;
    case 'history_list':
      return true;
    case 'history_exit':
      return (
        c.launches >= INTERSTITIAL_MIN_LAUNCHES &&
        c.hasLoggedGlass &&
        !c.celebrationPlaying &&
        !within(c.now, c.lastLogAt, INTERSTITIAL_AFTER_LOG_MS) &&
        !within(c.now, c.lastExternalOpenAt, INTERSTITIAL_AFTER_EXTERNAL_MS) &&
        c.interstitialsToday < INTERSTITIALS_PER_DAY
      );
    case 'app_open':
    case 'app_open_warm':
      return (
        c.launches >= APP_OPEN_MIN_LAUNCHES &&
        !c.celebrationPlaying &&
        !within(c.now, c.lastExternalOpenAt, APP_OPEN_AFTER_EXTERNAL_MS) &&
        !within(c.now, c.lastInterruptionAt, AFTER_INTERRUPTION_MS)
      );
    default:
      return true;
  }
}
