import { getCalendars } from 'expo-localization';

export type TimeFormat = '12h' | '24h';

/** The phone's own clock setting; 24-hour when it can't be read. */
export function deviceTimeFormat(): TimeFormat {
  try {
    const uses24 = getCalendars()[0]?.uses24hourClock;
    return uses24 === false ? '12h' : '24h';
  } catch {
    return '24h';
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Day-period labels; the app passes translated ones. */
export interface Periods {
  am: string;
  pm: string;
}
const EN: Periods = { am: 'AM', pm: 'PM' };

/** "HH:mm" (stored form, always 24-hour) for display: "8:30 PM" or "20:30". */
export function formatTime(hhmm: string, format: TimeFormat, periods: Periods = EN): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  if (format === '24h') return `${pad(h)}:${pad(m)}`;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${h < 12 ? periods.am : periods.pm}`;
}

/** A whole hour (0–23) for display: "12 AM" / "00:00". */
export const formatHour = (hour: number, format: TimeFormat, periods: Periods = EN) => {
  if (format === '24h') return `${pad(hour)}:00`;
  return `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? periods.am : periods.pm}`;
};

/** Hour (0–23), minute and back to "HH:mm". */
export const toHHMM = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`;
export const fromHHMM = (hhmm: string): { hour: number; minute: number } => {
  const [hour, minute] = hhmm.split(':').map(Number);
  return { hour: Number.isFinite(hour) ? hour : 0, minute: Number.isFinite(minute) ? minute : 0 };
};
