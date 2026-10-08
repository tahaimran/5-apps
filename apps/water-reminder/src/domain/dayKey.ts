import type { DayKey, MinuteOfDay } from './types';

/** Hours before wake-up at which the logical day starts (plan §8.5). */
export const DAY_GRACE_MIN = 120;
export const MIN_PER_DAY = 1440;

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' of the local calendar date. */
export function localDateKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of a day key. */
export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

/** Whole days from `a` to `b` (positive when b is later). Immune to DST. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Every day key from `from` to `to`, inclusive. Empty when `to` is before `from`. */
export function dayRange(from: DayKey, to: DayKey): DayKey[] {
  const n = daysBetween(from, to);
  return n < 0 ? [] : Array.from({ length: n + 1 }, (_, i) => addDays(from, i));
}

/** 0 = Sunday .. 6 = Saturday. */
export const weekdayOf = (key: DayKey): number => parseDayKey(key).getDay();

export const monthKeyOf = (key: DayKey): string => key.slice(0, 7);

export const minuteOfDay = (d: Date): MinuteOfDay => d.getHours() * 60 + d.getMinutes();

/** The instant `minute` minutes after local midnight of `day` (past 1440 runs into the next day). */
export function atMinute(day: DayKey, minute: number): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 0, minute, 0, 0);
}

/**
 * The logical day of an instant: it runs from `wakeMin - 120 min` on date D to the same time on
 * D+1, so a drink at 01:30 with a 07:00 wake-up still counts for yesterday.
 */
export function dayKeyFor(at: Date | number, wakeMin: MinuteOfDay): DayKey {
  const d = typeof at === 'number' ? new Date(at) : at;
  const date = localDateKey(d);
  const minute = minuteOfDay(d);
  const cutoff = wakeMin - DAY_GRACE_MIN;
  if (cutoff >= 0) return minute < cutoff ? addDays(date, -1) : date;
  // Wake-up shortly after midnight: the day already starts the evening before.
  return minute >= MIN_PER_DAY + cutoff ? addDays(date, 1) : date;
}

export const formatClock = (minute: MinuteOfDay): string => {
  const m = ((minute % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
