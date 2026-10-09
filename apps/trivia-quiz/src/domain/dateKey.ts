import type { DateKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` in the device's local time. */
export const dateKeyFor = (d: Date): DateKey => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parts = (key: DateKey): [number, number, number] => {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
};

/** Calendar-day arithmetic in UTC so daylight-saving changes cannot add or lose a day. */
const dayNumber = (key: DateKey): number => {
  const [y, m, d] = parts(key);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

/** Whole calendar days from `a` to `b` (positive when b is later). */
export const dayDiff = (a: DateKey, b: DateKey): number => dayNumber(b) - dayNumber(a);

export const addDays = (key: DateKey, n: number): DateKey => {
  const [y, m, d] = parts(key);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

/** 1 for January 1st. */
export const dayOfYear = (key: DateKey): number => {
  const [y] = parts(key);
  return dayDiff(`${y}-01-01`, key) + 1;
};

export const monthKeyOf = (key: DateKey): string => key.slice(0, 7);
export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();
/** 0 = Sunday. */
export const weekdayOf = (key: DateKey): number => {
  const [y, m, d] = parts(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const shiftMonth = (monthKey: string, delta: number): string => {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
};

/** Milliseconds from `now` until the next local midnight (plus a second so the new day has begun). */
export const msUntilMidnight = (now: Date): number => {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
};

export const isDateKey = (v: unknown): v is DateKey => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Days since 1970-01-01 for a local date key (the `d` of a seen entry). */
export const epochDay = (key: DateKey): number => dayNumber(key);
