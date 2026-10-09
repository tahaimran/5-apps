import { t } from '@shared/i18n';

const pad = (n: number) => String(n).padStart(2, '0');
const whole = (ms: number) => Math.max(0, Math.floor(ms / 1000));

/** `3:12`, or `1:03:12` from an hour up: the running timer and "since last started". */
export function mmss(ms: number): string {
  const total = whole(ms);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** `42s`, `4m 50s`, `5m`, `1h 05m`: durations and intervals in the stats ("every 4m 50s"). Rounds to the nearest second. */
export function compact(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

const plural = (n: number, one: string, other: string) => t(n === 1 ? one : other, { n });

/** "42 seconds", "1 minute 12 seconds": what a screen reader reads out. */
export function spoken(ms: number): string {
  const total = whole(ms);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(plural(h, 'time.hour', 'time.hours'));
  if (m > 0) parts.push(plural(m, 'time.minute', 'time.minutes'));
  if (s > 0 || parts.length === 0) parts.push(plural(s, 'time.second', 'time.seconds'));
  return parts.join(' ');
}

/** `02:58`, or `2:58 AM` when the 12-hour clock is chosen, in the phone's local time. */
export function clockTime(ts: number, clock24h: boolean): string {
  const d = new Date(ts);
  if (clock24h) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const h = d.getHours() % 12 || 12;
  return `${h}:${pad(d.getMinutes())} ${t(d.getHours() < 12 ? 'time.am' : 'time.pm')}`;
}

/** `Tue 4 Nov` (local time). */
export const shortDate = (ts: number): string => {
  const d = new Date(ts);
  return `${t(`date.weekday.${d.getDay()}`)} ${d.getDate()} ${t(`date.month.${d.getMonth()}`)}`;
};

/** `Tue 4 Nov 2026` (local time). */
export const longDate = (ts: number): string => `${shortDate(ts)} ${new Date(ts).getFullYear()}`;

/** A `YYYY-MM-DD` key as `12 November` (the due date). */
export function dayMonth(key: string): string {
  const [, m, d] = key.split('-').map(Number);
  return `${d} ${t(`date.monthLong.${m - 1}`)}`;
}

/** A due date as `12 November 2026`. */
export const fullDate = (key: string): string => `${dayMonth(key)} ${key.slice(0, 4)}`;
