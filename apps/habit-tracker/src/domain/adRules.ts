export interface AdContext {
  now: number;
  onboardingDone: boolean;
  /** At least one check-in has ever been made (the first-value moment). */
  hasCheckedIn: boolean;
  habitCount: number;
  /** Distinct days the app has been opened on. */
  openDays: number;
  /** When the app last came to the foreground (ms). */
  appForegroundAt: number;
  lastCheckInAt: number | null;
  lastRewardedAt: number | null;
  /** Last launch from a notification or widget tap (ms). */
  lastExternalOpenAt: number | null;
}

export const INTERSTITIAL_AFTER_OPEN_MS = 30_000;
export const INTERSTITIAL_AFTER_CHECKIN_MS = 10_000;
export const INTERSTITIAL_AFTER_REWARDED_MS = 3 * 60_000;
export const EXTERNAL_LAUNCH_WINDOW_MS = 10_000;
export const APP_OPEN_MIN_DAYS = 2;
export const NATIVE_MIN_HABITS = 3;

/**
 * The app-level veto from DEVELOPMENT_PLAN.md §12 ("Never show" column). Frequency caps live in
 * @shared/ads; this decides whether the moment is right.
 */
export function adAllowed(placement: string, c: AdContext): boolean {
  if (!c.onboardingDone || !c.hasCheckedIn) return false;
  switch (placement) {
    case 'today_bottom':
      return true;
    case 'stats_list':
      return c.habitCount >= NATIVE_MIN_HABITS;
    case 'leave_stats':
    case 'after_edit':
      return (
        c.now - c.appForegroundAt >= INTERSTITIAL_AFTER_OPEN_MS &&
        (c.lastCheckInAt === null || c.now - c.lastCheckInAt >= INTERSTITIAL_AFTER_CHECKIN_MS) &&
        (c.lastRewardedAt === null || c.now - c.lastRewardedAt >= INTERSTITIAL_AFTER_REWARDED_MS)
      );
    case 'app_open':
    case 'app_open_warm':
      return (
        c.openDays >= APP_OPEN_MIN_DAYS &&
        (c.lastExternalOpenAt === null || c.now - c.lastExternalOpenAt >= EXTERNAL_LAUNCH_WINDOW_MS)
      );
    default:
      return true;
  }
}
