import { applySelection, foundCount, isComplete, startGame, unfoundWords } from '../game';
import { generatePuzzle, wordCells } from '../generator';
import { PACKS } from '../packs';
import { cellAt, cellCenter, directionOf, evaluateSelection, lineBetween, projectEnd, sameCell, snapDirection, TOUCH_SLOP, type Cell } from '../selection';
import { DIRECTIONS_BY_DIFFICULTY } from '../directions';
import type { Difficulty, Puzzle } from '../types';

const make = (difficulty: Difficulty, seed = 5): Puzzle => {
  const pack = PACKS[0];
  return generatePuzzle({ id: 'sel', packId: pack.id, difficulty, size: difficulty === 'easy' ? 8 : difficulty === 'medium' ? 10 : 12, seed, words: pack.words });
};
const cellsOf = (p: Puzzle, i: number): Cell[] => wordCells(p.words[i], p.size).map((n) => ({ row: Math.floor(n / p.size), col: n % p.size }));

describe('cellAt', () => {
  it('finds the cell under a point and clamps to the edge within the 30% slop', () => {
    expect(cellAt(5, 5, 40, 8)).toEqual({ row: 0, col: 0 });
    expect(cellAt(79, 41, 40, 8)).toEqual({ row: 1, col: 1 });
    expect(cellAt(-0.2 * 40, 10, 40, 8)).toEqual({ row: 0, col: 0 });
    expect(cellAt(40 * 8 + TOUCH_SLOP * 40 - 1, 40 * 8, 40, 8)).toEqual({ row: 7, col: 7 });
  });
  it('ignores points well outside the grid', () => {
    expect(cellAt(-40, 10, 40, 8)).toBeNull();
    expect(cellAt(10, 40 * 8 + 40, 40, 8)).toBeNull();
  });
});

describe('snapDirection (plan §8.4)', () => {
  const start = { row: 3, col: 3 };
  const c = cellCenter(start, 50);
  const toward = (dx: number, dy: number) => snapDirection(start, c.x + dx, c.y + dy, 50, DIRECTIONS_BY_DIFFICULTY.hard);
  it('waits until the finger leaves the start cell', () => {
    expect(toward(5, 3)).toBeNull();
  });
  it('quantizes the heading to 45 degrees', () => {
    expect(toward(80, 10)).toBe('E');
    expect(toward(80, 70)).toBe('SE');
    expect(toward(10, 80)).toBe('S');
    expect(toward(-80, 60)).toBe('SW');
    expect(toward(-80, 0)).toBe('W');
    expect(toward(-60, -70)).toBe('NW');
    expect(toward(0, -80)).toBe('N');
    expect(toward(70, -60)).toBe('NE');
  });
  it('only offers directions allowed on the difficulty', () => {
    const easy = DIRECTIONS_BY_DIFFICULTY.easy;
    expect(snapDirection(start, c.x + 70, c.y + 80, 50, easy)).toBe('S'); // diagonal heading snaps to the nearest of E/S
    expect(snapDirection(start, c.x - 80, c.y, 50, easy)).toBeNull(); // backwards is not offered on Easy
    expect(snapDirection(start, c.x, c.y - 80, 50, easy)).toBeNull();
    expect(snapDirection(start, c.x - 80, c.y, 50, DIRECTIONS_BY_DIFFICULTY.medium)).toBeNull();
  });
});

describe('projectEnd', () => {
  const start = { row: 2, col: 2 };
  const c = cellCenter(start, 40);
  it('ends on the cell the finger has reached along the line', () => {
    expect(projectEnd(start, 'E', c.x + 3 * 40, c.y + 12, 40, 8)).toEqual({ row: 2, col: 5 });
    expect(projectEnd(start, 'S', c.x - 9, c.y + 2 * 40, 40, 8)).toEqual({ row: 4, col: 2 });
    expect(projectEnd(start, 'SE', c.x + 2 * 40, c.y + 2 * 40, 40, 8)).toEqual({ row: 4, col: 4 });
    expect(projectEnd(start, 'NE', c.x + 40, c.y - 40, 40, 8)).toEqual({ row: 1, col: 3 });
  });
  it('stays inside the grid and never goes behind the start', () => {
    expect(projectEnd(start, 'E', c.x + 40 * 20, c.y, 40, 8)).toEqual({ row: 2, col: 7 });
    expect(projectEnd(start, 'SE', c.x + 40 * 20, c.y + 40 * 20, 40, 8)).toEqual({ row: 7, col: 7 });
    expect(projectEnd(start, 'E', c.x - 100, c.y, 40, 8)).toEqual(start);
  });
});

describe('lineBetween and directionOf', () => {
  it('lists the cells of a straight line and refuses a crooked one', () => {
    expect(lineBetween({ row: 1, col: 1 }, { row: 1, col: 4 })).toHaveLength(4);
    expect(lineBetween({ row: 4, col: 4 }, { row: 1, col: 1 })).toHaveLength(4);
    expect(lineBetween({ row: 1, col: 1 }, { row: 3, col: 2 })).toBeNull();
    expect(lineBetween({ row: 2, col: 2 }, { row: 2, col: 2 })).toEqual([{ row: 2, col: 2 }]);
  });
  it('names the direction of a line', () => {
    expect(directionOf(lineBetween({ row: 0, col: 0 }, { row: 0, col: 2 })!)).toBe('E');
    expect(directionOf(lineBetween({ row: 3, col: 0 }, { row: 0, col: 3 })!)).toBe('NE');
    expect(directionOf(lineBetween({ row: 3, col: 3 }, { row: 0, col: 0 })!)).toBe('NW');
    expect(directionOf([{ row: 0, col: 0 }])).toBeNull();
    expect(sameCell({ row: 1, col: 2 }, { row: 1, col: 2 })).toBe(true);
  });
});

describe('evaluateSelection', () => {
  it('accepts every word selected from its first letter, on every difficulty', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const p = make(d, seed);
        p.words.forEach((_, i) => expect(evaluateSelection(p, cellsOf(p, i)).kind).toBe('found'));
      }
    }
  });
  it('accepts a word selected from its last letter only where the reverse direction is allowed (Hard)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const d of ['easy', 'medium', 'hard'] as const) {
        const p = make(d, seed);
        p.words.forEach((_, i) => {
          const backwards = cellsOf(p, i).reverse();
          expect(evaluateSelection(p, backwards).kind).toBe(d === 'hard' ? 'found' : 'invalid');
        });
      }
    }
  });
  it('rejects random lines, single cells and lines that do not cover a whole word', () => {
    const p = make('hard');
    expect(evaluateSelection(p, [{ row: 0, col: 0 }]).kind).toBe('invalid');
    const c = cellsOf(p, 0);
    expect(evaluateSelection(p, c.slice(0, -1)).kind).toBe('invalid');
    expect(evaluateSelection(p, [])).toEqual({ kind: 'invalid' });
  });
  it('reports a word that was already found', () => {
    const p = make('easy');
    const game = applySelection(startGame(p, 0), cellsOf(p, 0)).game;
    expect(evaluateSelection(game.puzzle, cellsOf(game.puzzle, 0)).kind).toBe('already');
  });
});

describe('game state', () => {
  it('marks words found with rotating colors, and completes on the last one', () => {
    const p = make('easy', 11);
    let game = startGame(p, 1000);
    expect(unfoundWords(game)).toHaveLength(p.words.length);
    for (let i = 0; i < p.words.length; i++) {
      const out = applySelection(game, cellsOf(p, i));
      expect(out.result.kind).toBe('found');
      expect(out.game.puzzle.words[i].colorIdx).toBe(i);
      expect(out.complete).toBe(i === p.words.length - 1);
      game = out.game;
      expect(foundCount(game)).toBe(i + 1);
    }
    expect(isComplete(game)).toBe(true);
  });
  it('leaves the game untouched for an invalid or repeated selection', () => {
    const p = make('easy', 12);
    const game = startGame(p, 0);
    expect(applySelection(game, [{ row: 0, col: 0 }, { row: 0, col: 1 }]).game).toBe(game);
    const once = applySelection(game, cellsOf(p, 0)).game;
    const again = applySelection(once, cellsOf(p, 0));
    expect(again.game).toBe(once);
    expect(again.result.kind).toBe('already');
  });
  it('clears a hint on the word that was found', () => {
    const p = make('easy', 13);
    const game = { ...startGame(p, 0), hintedWords: [{ word: p.words[0].word, level: 1 as const }] };
    expect(applySelection(game, cellsOf(p, 0)).game.hintedWords).toEqual([]);
  });
});
