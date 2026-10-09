import type { DateKey } from '@/domain/types';

const toDate = (key: DateKey) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** "Thu, Oct 8" in the device language. */
export const formatDay = (key: DateKey): string => toDate(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
/** "Thursday, October 8". */
export const formatLongDay = (key: DateKey): string => toDate(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
/** "October 2026" for a `YYYY-MM` key. */
export const formatMonth = (monthKey: string): string => {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};
/** Short weekday names starting on Sunday ("Sun" … "Sat"). */
export const weekdayNames = (): string[] => Array.from({ length: 7 }, (_, i) => new Date(2023, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'short' }));

/** "9:00 AM" in the device language. */
export const formatTime = (hour: number, minute: number): string => new Date(2023, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
