import { DIRECTIONS_BY_DIFFICULTY, DIRECTION_VECTORS } from './directions';
import { wordCells } from './generator';
import type { Direction, PlacedWord, Puzzle } from './types';

export interface Cell {
  row: number;
  col: number;
}

export const sameCell = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col;

/** Touch slop: a finger within this fraction of a cell outside the grid still counts as the edge cell (plan §7.3). */
export const TOUCH_SLOP = 0.3;

/** The cell under a point (x, y in dp from the grid's top-left), or null if it is outside even with the slop. */
export function cellAt(x: number, y: number, cellSize: number, size: number): Cell | null {
  const slop = cellSize * TOUCH_SLOP;
  const extent = cellSize * size;
  if (x < -slop || y < -slop || x > extent + slop || y > extent + slop) return null;
  const clamp = (n: number) => Math.min(size - 1, Math.max(0, n));
  return { row: clamp(Math.floor(y / cellSize)), col: clamp(Math.floor(x / cellSize)) };
}

export const cellCenter = (cell: Cell, cellSize: number) => ({ x: (cell.col + 0.5) * cellSize, y: (cell.row + 0.5) * cellSize });

const ANGLES: Record<Direction, number> = { E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: -135, N: -90, NE: -45 };
const angleDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Below this distance (in cells) from the start the finger has not chosen a direction yet. */
const DEAD_ZONE = 0.35;

/**
 * Plan §8.4: the direction the finger is heading, snapped to the nearest allowed one (angle quantized
 * to 45°, filtered by difficulty). Null while the finger is still on the start cell, or when it heads
 * somewhere no allowed direction is within 45° (for example backwards on Easy).
 */
export function snapDirection(start: Cell, fx: number, fy: number, cellSize: number, allowed: readonly Direction[]): Direction | null {
  const c = cellCenter(start, cellSize);
  const dx = fx - c.x;
  const dy = fy - c.y;
  if (Math.hypot(dx, dy) < cellSize * DEAD_ZONE) return null;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let best: Direction | null = null;
  let bestDiff = 46;
  for (const d of allowed) {
    const diff = angleDiff(angle, ANGLES[d]);
    if (diff < bestDiff) {
      best = d;
      bestDiff = diff;
    }
  }
  return best;
}

/** The last cell on the line from `start` in `dir` that the finger has reached (projection), kept inside the grid. */
export function projectEnd(start: Cell, dir: Direction, fx: number, fy: number, cellSize: number, size: number): Cell {
  const { dr, dc } = DIRECTION_VECTORS[dir];
  const c = cellCenter(start, cellSize);
  const unit = Math.hypot(dc, dr); // 1 for straight lines, √2 for diagonals
  const along = ((fx - c.x) * dc + (fy - c.y) * dr) / unit; // distance travelled along the line, in dp
  let n = Math.max(0, Math.round(along / (unit * cellSize)));
  while (n > 0) {
    const row = start.row + dr * n;
    const col = start.col + dc * n;
    if (row >= 0 && row < size && col >= 0 && col < size) return { row, col };
    n--;
  }
  return start;
}

/** The cells from `a` to `b` if they are on one straight line (row, column or diagonal), else null. */
export function lineBetween(a: Cell, b: Cell): Cell[] | null {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, i) => ({ row: a.row + sr * i, col: a.col + sc * i }));
}

/** The direction from the first to the last cell of a line, or null for a single cell. */
export function directionOf(cells: readonly Cell[]): Direction | null {
  if (cells.length < 2) return null;
  const dr = Math.sign(cells[cells.length - 1].row - cells[0].row);
  const dc = Math.sign(cells[cells.length - 1].col - cells[0].col);
  const entry = (Object.entries(DIRECTION_VECTORS) as [Direction, { dr: number; dc: number }][]).find(([, v]) => v.dr === dr && v.dc === dc);
  return entry ? entry[0] : null;
}

export type SelectionResult = { kind: 'found'; word: PlacedWord } | { kind: 'already'; word: PlacedWord } | { kind: 'invalid' };

/**
 * Plan §8.4 "Evaluate". A selection counts when it covers exactly the cells of a word and the way
 * it was selected is allowed on this difficulty: selecting from the first letter always works,
 * selecting from the last letter works only where the reverse direction is allowed (Hard). On Easy
 * and Medium a backwards selection is simply not a word.
 */
export function evaluateSelection(puzzle: Puzzle, cells: readonly Cell[]): SelectionResult {
  const dir = directionOf(cells);
  if (!dir || !DIRECTIONS_BY_DIFFICULTY[puzzle.difficulty].includes(dir)) return { kind: 'invalid' };
  const first = cells[0];
  const last = cells[cells.length - 1];
  const word = puzzle.words.find((w) => {
    if (w.word.length !== cells.length) return false;
    const span = wordCells(w, puzzle.size);
    const a = span[0];
    const b = span[span.length - 1];
    const at = (cell: Cell) => cell.row * puzzle.size + cell.col;
    return (a === at(first) && b === at(last)) || (a === at(last) && b === at(first));
  });
  if (!word) return { kind: 'invalid' };
  return word.found ? { kind: 'already', word } : { kind: 'found', word };
}
