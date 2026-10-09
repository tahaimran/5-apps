/**
 * Due-date maths, DEVELOPMENT_PLAN.md §8.4. Everything works on calendar dates (`YYYY-MM-DD`) in UTC
 * day numbers, so a daylight-saving change can never add or remove a day.
 */
import { addDays, dayDiff } from './dateKey';
import type { DateKey, DateMode, Profile } from './types';

export const PREGNANCY_DAYS = 280;
export const CONCEPTION_TO_DUE = 266;
export const CYCLE_LIMITS = { min: 21, max: 45, default: 28 } as const;
export const MAX_LMP_AGE_DAYS = 44 * 7;
/** Plan §8.4 validation: a due date from 4 weeks ago to 42 weeks ahead. */
export const EDD_PAST_DAYS = 4 * 7;
export const EDD_FUTURE_DAYS = 42 * 7;
export const PAST_DUE_WEEKS = 42;

export interface DueInput {
  mode: DateMode;
  date: DateKey;
  cycleLength?: number;
  ivfEmbryoDay?: 3 | 5;
}

/** The estimated due date for what the person entered. */
export function eddFrom(input: DueInput): DateKey {
  switch (input.mode) {
    case 'edd':
      return input.date;
    case 'lmp': {
      const cycle = Math.min(CYCLE_LIMITS.max, Math.max(CYCLE_LIMITS.min, Math.round(input.cycleLength ?? CYCLE_LIMITS.default)));
      return addDays(input.date, PREGNANCY_DAYS + (cycle - 28));
    }
    case 'conception':
      return addDays(input.date, CONCEPTION_TO_DUE);
    case 'ivf':
      return addDays(input.date, CONCEPTION_TO_DUE - (input.ivfEmbryoDay ?? 5));
  }
}

/** The first day of the last period that gives this due date (`EDD - 280`). */
export const lmpEquivalent = (edd: DateKey): DateKey => addDays(edd, -PREGNANCY_DAYS);

export type DueError = 'lmp-future' | 'lmp-too-old' | 'date-future' | 'edd-too-early' | 'edd-too-late';

/**
 * Checks an entry against the plan's limits. An LMP or conception date cannot be in the future;
 * a due date must be within -4…+42 weeks of today.
 */
export function validateDue(input: DueInput, today: DateKey): DueError | null {
  if (input.mode === 'lmp') {
    if (dayDiff(today, input.date) > 0) return 'lmp-future';
    if (dayDiff(input.date, today) > MAX_LMP_AGE_DAYS) return 'lmp-too-old';
  }
  if ((input.mode === 'conception' || input.mode === 'ivf') && dayDiff(today, input.date) > 0) return 'date-future';
  const edd = eddFrom(input);
  const untilDue = dayDiff(today, edd);
  if (untilDue < -EDD_PAST_DAYS) return 'edd-too-early';
  if (untilDue > EDD_FUTURE_DAYS) return 'edd-too-late';
  return null;
}

export type Trimester = 1 | 2 | 3;

export interface Gestation {
  /** Days since the equivalent LMP; can be negative for a date far in the future. */
  days: number;
  weeks: number;
  day: number;
  trimester: Trimester;
  /** Days until the due date (negative once past it). */
  daysToGo: number;
  /** After 42 weeks and 0 days: the app only says that the provider will guide next steps. */
  pastDue: boolean;
}

export const trimesterOf = (weeks: number): Trimester => (weeks < 14 ? 1 : weeks < 28 ? 2 : 3);

export function gestationOn(edd: DateKey, today: DateKey): Gestation {
  const days = Math.max(0, dayDiff(lmpEquivalent(edd), today));
  const weeks = Math.floor(days / 7);
  return { days, weeks, day: days % 7, trimester: trimesterOf(weeks), daysToGo: dayDiff(today, edd), pastDue: days > PAST_DUE_WEEKS * 7 };
}

/** Plan §8.4: the display is clamped to 0–44 weeks. */
export const displayWeeks = (g: Gestation): { weeks: number; day: number } => (g.weeks >= 44 ? { weeks: 44, day: 0 } : { weeks: g.weeks, day: g.day });

/** The due date for a stored profile, or null when none is set. */
export function profileEdd(p: Profile): DateKey | null {
  if (p.edd) return p.edd;
  if (!p.dateMode || !p.inputDate) return null;
  return eddFrom({ mode: p.dateMode, date: p.inputDate, cycleLength: p.cycleLength, ivfEmbryoDay: p.ivfEmbryoDay });
}

/** The first day of pregnancy week `n` (week 0 starts on the equivalent LMP). */
export const startOfWeek = (edd: DateKey, week: number): DateKey => addDays(lmpEquivalent(edd), week * 7);
