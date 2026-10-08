import type { DayKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Local date key for `now`, shifted back by `dayEndsAtHour` so a check-in at 01:30 with
 * `dayEndsAtHour=3` counts for the previous day (night owls). Entries store this key, never a
 * UTC timestamp, so travelling across time zones never moves past check-ins.
 */
export function dayKeyFor(now: Date, dayEndsAtHour = 0): DayKey {
  const shifted = new Date(now.getTime() - dayEndsAtHour * 3_600_000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}` as DayKey;
}
