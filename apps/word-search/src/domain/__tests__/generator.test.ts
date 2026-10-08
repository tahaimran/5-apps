import { DIRECTIONS_BY_DIFFICULTY } from '../directions';
import { DIFFICULTY_CONFIG, findOccurrences, generatePuzzle, normalizeWord, wordCells, wordCountRange } from '../generator';
import { hash32 } from '../prng';
import { PACKS } from '../packs';
import { levelPuzzle, parsePuzzleId, tutorialPuzzle, TUTORIAL_WORDS } from '../puzzles';
import { verifyPuzzle } from '../verify';
import type { Difficulty } from '../types';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const make = (difficulty: Difficulty, seed: number, size = DIFFICULTY_CONFIG[difficulty].baseSize, pack = PACKS[seed % PACKS.length]) =>
  generatePuzzle({ id: `t:${difficulty}:${seed}`, packId: pack.id, difficulty, size, seed, words: pack.words });

describe('generator (plan F1, §8.3)', () => {
  describe.each(DIFFICULTIES)('%s: 1,000 seeds', (difficulty) => {
    it('places every word exactly once in an allowed direction, with no blocked words', () => {
      const failures: string[] = [];
      for (let seed = 1; seed <= 1000; seed++) {
        const p = make(difficulty, seed);
        const problems = verifyPuzzle(p);
        if (problems.length) failures.push(`seed ${seed}: ${problems.join('; ')}`);
        const range = wordCountRange(difficulty, p.size);
        // a reduced count after restarts is allowed but must stay near the range
        if (p.words.length < Math.max(3, range.min - 3) || p.words.length > range.max) failures.push(`seed ${seed}: ${p.words.length} words`);
      }
      expect(failures).toEqual([]);
    });
  });

  it('is reproducible: the same options give the same puzzle', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(make(difficulty, 99)).toEqual(make(difficulty, 99));
      expect(make(difficulty, 99).grid).not.toEqual(make(difficulty, 100).grid);
    }
  });

  it.each([6, 7, 8, 9, 10, 11, 12])('works on a %s-wide grid for every difficulty and pack', (size) => {
    for (const difficulty of DIFFICULTIES) {
      for (const [i, pack] of PACKS.entries()) {
        const p = generatePuzzle({ id: 'x', packId: pack.id, difficulty, size, seed: hash32(`${size}${difficulty}${i}`), words: pack.words });
        expect(verifyPuzzle(p)).toEqual([]);
        expect(p.size).toBe(size);
      }
    }
  });

  it('uses only the directions of the difficulty, and hard really uses all of them across seeds', () => {
    const used = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      for (const w of make('hard', seed).words) used.add(w.dir);
      for (const w of make('easy', seed).words) expect(DIRECTIONS_BY_DIFFICULTY.easy).toContain(w.dir);
      for (const w of make('medium', seed).words) expect(DIRECTIONS_BY_DIFFICULTY.medium).toContain(w.dir);
    }
    expect([...used].sort()).toEqual(['E', 'N', 'NE', 'NW', 'S', 'SE', 'SW', 'W']);
  });

  it('includes a long word and no word that hides inside another', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const p = make('medium', seed);
      expect(Math.max(...p.words.map((w) => w.word.length))).toBeGreaterThanOrEqual(p.size - 2);
      for (const a of p.words) for (const b of p.words) if (a !== b) expect(a.word.includes(b.word)).toBe(false);
    }
  });

  it('counts a palindrome once and sees overlaps', () => {
    const cells = 'LEVELXXXXXXXXXXX'.split('');
    expect(findOccurrences(cells, 4, 'LEVEL')).toHaveLength(0); // longer than the grid
    const row = 'ABABA'.split('').concat(Array(20).fill('Q'));
    expect(findOccurrences(row, 5, 'ABA')).toHaveLength(2); // overlapping ABA at 0 and 2
    const pal = 'ABCBA'.split('').concat(Array(20).fill('Q'));
    expect(findOccurrences(pal, 5, 'ABCBA')).toHaveLength(1);
  });

  it('finds words on all four axes and in reverse', () => {
    // 4x4 with CAT down-right, reversed TAC on a row, DOG up-right
    const g = ['CXXG', 'XAXO', 'XXTD', 'TACX'];
    const cells = g.join('').split('');
    expect(findOccurrences(cells, 4, 'CAT')).toHaveLength(2); // diagonal and the reversed row
    expect(findOccurrences(cells, 4, 'DOG')).toHaveLength(1);
  });

  it('normalizes words (case, spaces, hyphens)', () => {
    expect(normalizeWord('ice-cream')).toBe('ICECREAM');
    expect(normalizeWord("Rock 'n' Roll")).toBe('ROCKNROLL');
  });

  it('caps the word count on small grids', () => {
    expect(wordCountRange('easy', 8)).toEqual({ min: 6, max: 7 });
    expect(wordCountRange('easy', 6)).toEqual({ min: 4, max: 4 });
    expect(wordCountRange('hard', 12)).toEqual({ min: 10, max: 14 });
  });

  it('throws a clear error when the pool cannot fill the grid', () => {
    expect(() => generatePuzzle({ id: 'x', packId: 'animals', difficulty: 'easy', size: 8, seed: 1, words: ['CAT'] })).toThrow(/Could not build/);
  });

  it('can reach the extremes: a pool of only long words still works', () => {
    const words = ['ELEPHANT', 'KANGAROO', 'GIRAFFES', 'CROCODILE', 'ARMADILLO', 'CHIMPANZEE', 'PORCUPINE', 'HEDGEHOGS', 'SQUIRRELS', 'CHEETAHS'];
    const p = generatePuzzle({ id: 'long', packId: 'animals', difficulty: 'hard', size: 12, seed: 5, words });
    expect(verifyPuzzle(p)).toEqual([]);
  });
});

describe('puzzle ids and level puzzles', () => {
  it('builds the same level every time and a different one for another level', () => {
    expect(levelPuzzle('animals', 'easy', 1, 8)).toEqual(levelPuzzle('animals', 'easy', 1, 8));
    expect(levelPuzzle('animals', 'easy', 1, 8).grid).not.toEqual(levelPuzzle('animals', 'easy', 2, 8).grid);
    expect(levelPuzzle('birds', 'medium', 3, 10).id).toBe('birds:medium:3');
  });
  it('rejects an unknown pack', () => {
    expect(() => levelPuzzle('nope', 'easy', 1, 8)).toThrow('Unknown pack');
  });
  it('parses ids and rejects bad ones', () => {
    expect(parsePuzzleId('animals:easy:12')).toEqual({ kind: 'level', packId: 'animals', difficulty: 'easy', level: 12 });
    expect(parsePuzzleId('daily:2026-10-08:hard')).toEqual({ kind: 'daily', dateKey: '2026-10-08', difficulty: 'hard' });
    expect(parsePuzzleId('tutorial')).toEqual({ kind: 'tutorial' });
    for (const bad of ['', 'animals:easy', 'animals:easy:0', 'animals:easy:x', 'nope:easy:1', 'animals:expert:1', 'daily:today:easy', 'daily:2026-10-08:x']) {
      expect(parsePuzzleId(bad)).toBeNull();
    }
  });
});

describe('tutorial puzzle (plan §6 screen 5)', () => {
  it('is a 6x6 easy grid with CAT, DOG, COW and HEN, the same every time', () => {
    const p = tutorialPuzzle();
    expect(p.size).toBe(6);
    expect(p.difficulty).toBe('easy');
    expect(p.words.map((w) => w.word).sort()).toEqual([...TUTORIAL_WORDS].sort());
    expect(verifyPuzzle(p)).toEqual([]);
    expect(tutorialPuzzle()).toEqual(p);
    for (const w of p.words) expect(wordCells(w, 6)).toHaveLength(3);
  });
});

describe('verifyPuzzle', () => {
  const good = () => make('easy', 3);
  it('accepts a generated puzzle', () => expect(verifyPuzzle(good())).toEqual([]));
  it('catches a word that is not where it says, a bad direction, and a malformed grid', () => {
    const p = good();
    const moved = { ...p, words: p.words.map((w, i) => (i === 0 ? { ...w, col: (w.col + 1) % p.size } : w)) };
    expect(verifyPuzzle(moved).length).toBeGreaterThan(0);
    const wrongDir = { ...p, words: p.words.map((w, i) => (i === 0 ? { ...w, dir: 'NW' as const } : w)) };
    expect(verifyPuzzle(wrongDir).some((x) => /not allowed|leaves|not at/.test(x))).toBe(true);
    expect(verifyPuzzle({ ...p, grid: p.grid.slice(1) })).toEqual(['grid is not a square of A–Z rows']);
  });
  it('catches a duplicated word and a blocked word', () => {
    const p = good();
    const w = p.words[0];
    // write the first word a second time on the last row if it fits, otherwise on its own copy
    const grid = p.grid.map((r) => r.split(''));
    const last = p.size - 1;
    for (let i = 0; i < w.word.length && i < p.size; i++) grid[last][i] = w.word[i];
    const dup = { ...p, grid: grid.map((r) => r.join('')) };
    expect(verifyPuzzle(dup).join(' ')).toMatch(/appears|not at its position/);
    const grid2 = p.grid.map((r) => r.split(''));
    grid2[0] = 'DAMN'.padEnd(p.size, 'Q').split('');
    const blockedGrid = { ...p, grid: grid2.map((r) => r.join('')), words: [] };
    expect(verifyPuzzle(blockedGrid).join(' ')).toMatch(/blocked word DAMN/);
  });
});
