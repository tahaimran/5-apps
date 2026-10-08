import { minCellDp } from '@/theme/tokens';
import { DIFFICULTY_CONFIG, MIN_GRID } from './generator';
import type { Difficulty, TextSize } from './types';

export const SCREEN_GUTTER = 16;
/** The grid never grows past this edge in dp, so a tablet does not get a wall of huge cells (the two-pane layout is v2.0). */
export const MAX_GRID_EDGE = 560;

const usableWidth = (screenWidthDp: number) => Math.min(screenWidthDp - 2 * SCREEN_GUTTER, MAX_GRID_EDGE);

/**
 * Plan §8.1: effective size = min(base, floor((screenWidthDp - 32) / minCellDp)), never below 6.
 * Bigger text means bigger cells, so a narrow screen gets a smaller grid.
 */
export function effectiveGridSize(difficulty: Difficulty, textSize: TextSize, screenWidthDp: number): number {
  const fit = Math.floor(usableWidth(screenWidthDp) / minCellDp[textSize]);
  return Math.max(MIN_GRID, Math.min(DIFFICULTY_CONFIG[difficulty].baseSize, fit));
}

/** Cell edge in dp for a grid of `size` on a screen of this width (fills the width minus the gutters). */
export const cellSizeFor = (size: number, screenWidthDp: number): number =>
  Math.floor(usableWidth(screenWidthDp) / size);
