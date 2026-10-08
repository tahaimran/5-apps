import { BLOCKED_WORDS } from './blocklist';
import { DIRECTIONS_BY_DIFFICULTY, DIRECTION_VECTORS } from './directions';
import { findOccurrences, wordCells } from './generator';
import type { Puzzle } from './types';

/**
 * Checks everything plan F1 promises about a puzzle and returns the problems (empty = valid):
 * every listed word is in the grid exactly once, in an allowed direction; the grid is square and
 * A–Z only; and no blocked word is spelled outside the listed words' own letters.
 */
export function verifyPuzzle(p: Puzzle): string[] {
  const problems: string[] = [];
  const { size } = p;
  if (p.grid.length !== size || p.grid.some((r) => r.length !== size || !/^[A-Z]+$/.test(r))) problems.push('grid is not a square of A–Z rows');
  if (problems.length) return problems;
  const cells = p.grid.join('').split('');
  const listed = new Set<number>();
  for (const w of p.words) {
    const { dr, dc } = DIRECTION_VECTORS[w.dir];
    const endR = w.row + dr * (w.word.length - 1);
    const endC = w.col + dc * (w.word.length - 1);
    if (w.row < 0 || w.col < 0 || endR < 0 || endC < 0 || w.row >= size || w.col >= size || endR >= size || endC >= size) {
      problems.push(`${w.word} leaves the grid`);
      continue;
    }
    if (!DIRECTIONS_BY_DIFFICULTY[p.difficulty].includes(w.dir)) problems.push(`${w.word} runs ${w.dir}, not allowed on ${p.difficulty}`);
    const spelled = wordCells(w, size).map((i) => cells[i]).join('');
    if (spelled !== w.word) problems.push(`${w.word} is not at its position (${spelled})`);
    for (const i of wordCells(w, size)) listed.add(i);
    const count = findOccurrences(cells, size, w.word).length;
    if (count !== 1) problems.push(`${w.word} appears ${count} times`);
  }
  for (const word of BLOCKED_WORDS) {
    for (const o of findOccurrences(cells, size, word)) {
      if (o.cells.some((i) => !listed.has(i))) problems.push(`blocked word ${word} is spelled in the grid`);
    }
  }
  return problems;
}
