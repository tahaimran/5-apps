import type { Rng } from './prng';
import { shuffled } from './prng';
import type { RoundMode } from './types';

export type LifelineKind = 'fifty' | 'skip' | 'time';
export const LIFELINES: readonly LifelineKind[] = ['fifty', 'skip', 'time'];

export type LifelineCounts = Record<LifelineKind, number>;

export interface Allowance {
  /** Free uses per round. */
  free: LifelineCounts;
  /** A rewarded video may grant one more of a spent lifeline. */
  rewarded: boolean;
}

export const MAX_REWARDED_LIFELINES_PER_ROUND = 2;

/**
 * Plan §8: one free of each per round; the Daily Challenge has Skip x1 and nothing else; the warm-up
 * has none. A rewarded video is never offered in the Daily or the warm-up.
 */
export function allowanceFor(mode: RoundMode): Allowance {
  switch (mode) {
    case 'daily':
      return { free: { fifty: 0, skip: 1, time: 0 }, rewarded: false };
    case 'warmup':
      return { free: { fifty: 0, skip: 0, time: 0 }, rewarded: false };
    default:
      return { free: { fifty: 1, skip: 1, time: 1 }, rewarded: true };
  }
}

/** Plan §8: 50/50 removes two wrong options at random (seeded). Returns the removed option indexes. */
export function fiftyFifty(correctIndex: number, rng: Rng): number[] {
  const wrong = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  return shuffled(rng, wrong).slice(0, 2).sort((a, b) => a - b);
}
