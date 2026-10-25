/**
 * The drawing math of the live selection, as worklets so the pill follows the finger on the UI thread
 * (plan §8.4). These only place the pill on screen; which cells are selected is still decided on the
 * JS side by the domain (`snapDirection`, `projectEnd`, `lineBetween` in domain/selection.ts) when the
 * finger lifts. gridGeometry.test.ts checks that both agree.
 */

/** Same as domain/selection.ts. */
export const TOUCH_SLOP = 0.3;
const DEAD_ZONE = 0.35;

export type Vec = readonly [dr: number, dc: number];

/** The cell index under (x, y), or -1 outside the grid even with the touch slop. */
export function cellIndexAt(x: number, y: number, cell: number, size: number): number {
  'worklet';
  const slop = cell * TOUCH_SLOP;
  const extent = cell * size;
  if (x < -slop || y < -slop || x > extent + slop || y > extent + slop) return -1;
  const row = Math.min(size - 1, Math.max(0, Math.floor(y / cell)));
  const col = Math.min(size - 1, Math.max(0, Math.floor(x / cell)));
  return row * size + col;
}

const angleDiff = (a: number, b: number) => {
  'worklet';
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** The allowed direction nearest the finger's heading from the start cell, or -1 (still on the start cell, or no direction within 45°). */
export function snapIndex(startIndex: number, fx: number, fy: number, cell: number, size: number, allowed: readonly Vec[]): number {
  'worklet';
  const cx = ((startIndex % size) + 0.5) * cell;
  const cy = (Math.floor(startIndex / size) + 0.5) * cell;
  const dx = fx - cx;
  const dy = fy - cy;
  if (Math.hypot(dx, dy) < cell * DEAD_ZONE) return -1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let best = -1;
  let bestDiff = 46;
  for (let i = 0; i < allowed.length; i++) {
    const [dr, dc] = allowed[i];
    const diff = angleDiff(angle, (Math.atan2(dr, dc) * 180) / Math.PI);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * Where the pill ends while the finger moves: the finger's projection onto the snapped line, continuous
 * (not jumping cell to cell), never before the start cell and never past the last cell inside the grid.
 * Returns [x, y, endCellIndex], the end cell being the one the selection would take now.
 */
export function pillEnd(startIndex: number, fx: number, fy: number, cell: number, size: number, dir: Vec | null): [number, number, number] {
  'worklet';
  const row = Math.floor(startIndex / size);
  const col = startIndex % size;
  const cx = (col + 0.5) * cell;
  const cy = (row + 0.5) * cell;
  if (!dir) return [cx, cy, startIndex];
  const [dr, dc] = dir;
  // How many cells the line can run from the start before leaving the grid.
  const room = Math.min(dr > 0 ? size - 1 - row : dr < 0 ? row : Infinity, dc > 0 ? size - 1 - col : dc < 0 ? col : Infinity);
  const unit = Math.hypot(dr, dc);
  const along = ((fx - cx) * dc + (fy - cy) * dr) / unit / (unit * cell); // in cells
  const steps = Math.max(0, Math.min(room, along));
  const n = Math.max(0, Math.min(room, Math.round(along)));
  return [cx + dc * steps * cell, cy + dr * steps * cell, (row + dr * n) * size + (col + dc * n)];
}
