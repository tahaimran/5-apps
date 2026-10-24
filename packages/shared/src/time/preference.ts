import { useMemo, useSyncExternalStore } from 'react';
import { t } from '../i18n';
import { deviceTimeFormat, formatHour, formatTime, toHHMM, type Periods, type TimeFormat } from './format';

/**
 * The user's choice lives in each app's own settings (and backups); the app pushes it here so shared
 * pieces like TimeField follow it. `undefined` means "use the phone's clock".
 */
let chosen: TimeFormat | undefined;
const listeners = new Set<() => void>();

export function setTimeFormatPreference(format: TimeFormat | undefined): void {
  if (format === chosen) return;
  chosen = format;
  listeners.forEach((l) => l());
}

/** The 12/24-hour style in effect right now (outside React, e.g. notification copy). */
export const currentTimeFormat = (): TimeFormat => chosen ?? deviceTimeFormat();

const periods = (): Periods => ({ am: t('shared.time.am'), pm: t('shared.time.pm') });

/** A Date's wall-clock time in the current style: "2:30 PM" or "14:30". */
export const formatClock = (date: Date, format: TimeFormat = currentTimeFormat()) =>
  formatTime(toHHMM(date.getHours(), date.getMinutes()), format, periods());

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const snapshot = () => chosen;

/** The clock style in use (the user's choice, else the phone's) and formatters bound to it. */
export function useTimeFormat() {
  const pref = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => {
    const format: TimeFormat = pref ?? deviceTimeFormat();
    const p = periods();
    return {
      format,
      periods: p,
      /** "HH:mm" → "8:30 PM" / "20:30". */
      time: (hhmm: string) => formatTime(hhmm, format, p),
      /** Whole hour → "8 PM" / "20:00". */
      hour: (hr: number) => formatHour(hr, format, p),
      /** A Date's wall-clock time. */
      at: (date: Date) => formatClock(date, format),
    };
  }, [pref]);
}
