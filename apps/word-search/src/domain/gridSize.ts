import { minCellDp } from '@/theme/tokens';
import { DIFFICULTY_CONFIG, MIN_GRID } from './generator';
import type { Difficulty, TextSize } from './types';

export const SCREEN_GUTTER = 16;

/**
 * Plan §8.1: effective size = min(base, floor((screenWidthDp - 32) / minCellDp)), never below 6.
 * Bigger text means bigger cells, so a narrow screen gets a smaller grid.
 */
export function effectiveGridSize(difficulty: Difficulty, textSize: TextSize, screenWidthDp: number): number {
  const fit = Math.floor((screenWidthDp - 2 * SCREEN_GUTTER) / minCellDp[textSize]);
  return Math.max(MIN_GRID, Math.min(DIFFICULTY_CONFIG[difficulty].baseSize, fit));
}

/** Cell edge in dp for a grid of `size` on a screen of this width (fills the width minus the gutters). */
export const cellSizeFor = (size: number, screenWidthDp: number): number =>
  Math.floor((screenWidthDp - 2 * SCREEN_GUTTER) / size);
