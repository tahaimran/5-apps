import { DIRECTION_VECTORS, DIRECTIONS_BY_DIFFICULTY } from '@/domain/directions';
import { cellAt, projectEnd, snapDirection } from '@/domain/selection';
import type { Difficulty } from '@/domain/types';
import { cellIndexAt, pillEnd, snapIndex, type Vec } from '../gridGeometry';

/**
 * The live pill runs on the UI thread with its own copies of the snapping math; the cells that count
 * are decided by the domain when the finger lifts. Both must agree, or the pill would show one word
 * and select another.
 */
const CELL = 48;
const SIZE = 10;

describe('gridGeometry agrees with the domain selection', () => {
  it('finds the same cell under a point, touch slop included', () => {
    for (let x = -20; x <= CELL * SIZE + 20; x += 7) {
      for (let y = -20; y <= CELL * SIZE + 20; y += 11) {
        const cell = cellAt(x, y, CELL, SIZE);
        expect(cellIndexAt(x, y, CELL, SIZE)).toBe(cell ? cell.row * SIZE + cell.col : -1);
      }
    }
  });

  it.each(['easy', 'medium', 'hard'] as Difficulty[])('snaps and projects to the same end cell on %s', (difficulty) => {
    const allowed = DIRECTIONS_BY_DIFFICULTY[difficulty];
    const vectors: Vec[] = allowed.map((d) => [DIRECTION_VECTORS[d].dr, DIRECTION_VECTORS[d].dc]);
    for (const start of [0, 11, 45, 55, 99]) {
      const from = { row: Math.floor(start / SIZE), col: start % SIZE };
      for (let fx = -30; fx < CELL * SIZE + 30; fx += 23) {
        for (let fy = -30; fy < CELL * SIZE + 30; fy += 29) {
          const dir = snapDirection(from, fx, fy, CELL, allowed);
          const i = snapIndex(start, fx, fy, CELL, SIZE, vectors);
          expect(i < 0 ? null : allowed[i]).toBe(dir);
          const [, , end] = pillEnd(start, fx, fy, CELL, SIZE, i < 0 ? null : vectors[i]);
          const domainEnd = dir ? projectEnd(from, dir, fx, fy, CELL, SIZE) : from;
          expect(end).toBe(domainEnd.row * SIZE + domainEnd.col);
        }
      }
    }
  });

  it('moves the pill end continuously along the line and stops at the grid edge', () => {
    const right: Vec = [0, 1];
    const [x1] = pillEnd(0, CELL * 1.5 + 5, CELL / 2, CELL, SIZE, right);
    const [x2] = pillEnd(0, CELL * 1.5 + 9, CELL / 2, CELL, SIZE, right);
    expect(x2).toBeGreaterThan(x1); // not snapped to cell centers while moving
    const [xEdge, , endEdge] = pillEnd(0, CELL * 40, CELL / 2, CELL, SIZE, right);
    expect(xEdge).toBe((SIZE - 0.5) * CELL);
    expect(endEdge).toBe(SIZE - 1);
    const [xBack, , endBack] = pillEnd(5, 0, CELL / 2, CELL, SIZE, right);
    expect(xBack).toBe(5.5 * CELL); // never before the start cell
    expect(endBack).toBe(5);
  });
});
