import type { DayKey, Weekday } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as DayKey;
}

export function parseDayKey(day: DayKey): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Local date key for `now`, shifted back by `dayEndsAtHour` so a check-in at 01:30 with
 * `dayEndsAtHour=3` counts for the previous day (night owls). Entries store this key, never a
 * UTC timestamp, so travelling across time zones never moves past check-ins.
 */
export function dayKeyFor(now: Date, dayEndsAtHour = 0): DayKey {
  return formatDayKey(new Date(now.getTime() - dayEndsAtHour * 3_600_000));
}

export function addDays(day: DayKey, n: number): DayKey {
  const d = parseDayKey(day);
  d.setDate(d.getDate() + n);
  return formatDayKey(d);
}

export function weekdayOf(day: DayKey): Weekday {
  return parseDayKey(day).getDay() as Weekday;
}

/** First day of the week containing `day`, for a week starting on `weekStartsOn` (0 = Sunday). */
export function startOfWeek(day: DayKey, weekStartsOn: 0 | 1): DayKey {
  return addDays(day, -((weekdayOf(day) - weekStartsOn + 7) % 7));
}

/** Whole days from `a` to `b` (negative if `b` is earlier). DST-safe. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** The 7 day keys of the week containing `day`. */
export function weekDays(day: DayKey, weekStartsOn: 0 | 1): DayKey[] {
  const start = startOfWeek(day, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
