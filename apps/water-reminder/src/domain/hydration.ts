import type { BeverageFactor, BeverageId } from './types';

export const FACTOR_MIN = 0.5;
export const FACTOR_MAX = 1;

/** Plan §8.7. Soda arrives in v1.1. */
export const defaultBeverages: BeverageFactor[] = [
  { id: 'water', factor: 1 },
  { id: 'sparkling', factor: 1 },
  { id: 'tea', factor: 0.9 },
  { id: 'milk', factor: 0.9 },
  { id: 'juice', factor: 0.85 },
  { id: 'coffee', factor: 0.8 },
];

export const beverageIcons: Record<BeverageId, string> = {
  water: 'water',
  sparkling: 'bottle-soda-outline',
  tea: 'tea',
  milk: 'cup-outline',
  juice: 'fruit-citrus',
  coffee: 'coffee',
  soda: 'cup',
};

/** Factors are editable between 0.5 and 1.0 in steps of 0.05. */
export const clampFactor = (f: number): number => Math.round(Math.min(FACTOR_MAX, Math.max(FACTOR_MIN, f)) * 20) / 20;

export function factorOf(beverages: BeverageFactor[], id: BeverageId): number {
  return beverages.find((b) => b.id === id)?.factor ?? defaultBeverages.find((b) => b.id === id)?.factor ?? 1;
}

/** What a drink counts as towards the goal: `round(volume x factor)`. */
export const effectiveMl = (volumeMl: number, factor: number): number => Math.round(volumeMl * factor);
