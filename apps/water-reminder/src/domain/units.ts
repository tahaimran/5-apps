import type { Unit } from './types';

export const ML_PER_FLOZ = 29.5735;
export const LB_PER_KG = 2.20462;

export const roundTo = (n: number, step: number): number => Math.round(n / step) * step;
export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** 1250 → "1,250". */
export const groupDigits = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const mlToFloz = (ml: number): number => Math.round((ml / ML_PER_FLOZ) * 10) / 10;
export const flozToMl = (floz: number): number => Math.round(floz * ML_PER_FLOZ);

export const kgToLb = (kg: number): number => Math.round(kg * LB_PER_KG);
export const lbToKg = (lb: number): number => Math.round((lb / LB_PER_KG) * 10) / 10;

/** The number shown for a volume in the user's unit (whole ml, fl oz to one decimal). */
export const volumeIn = (ml: number, unit: Unit): number => (unit === 'ml' ? Math.round(ml) : mlToFloz(ml));

/** "1,250" or "42.2" without the unit label (the label comes from i18n). */
export function formatAmount(ml: number, unit: Unit): string {
  const v = volumeIn(ml, unit);
  return unit === 'ml' ? groupDigits(v) : groupDigits(Math.trunc(v)) + (v % 1 === 0 ? '' : `.${Math.round((v % 1) * 10)}`);
}

/** Percent of the goal, rounded; 0 when there is no goal. */
export const percentOf = (ml: number, goalMl: number): number => (goalMl > 0 ? Math.round((ml / goalMl) * 100) : 0);

/** Step used by the goal stepper and the custom-amount stepper in each unit. */
export const stepMl = (unit: Unit): number => (unit === 'ml' ? 50 : flozToMl(2));
