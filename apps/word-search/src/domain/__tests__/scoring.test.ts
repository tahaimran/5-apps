import { defaultPackProgress, defaultStats } from '../defaults';
import { generatePuzzle } from '../generator';
import { PACKS } from '../packs';
import { partOfDay, recordLevel, recordStats, starsFor, totalStars } from '../scoring';
import { startGame } from '../game';

describe('stars (plan §8.7)', () => {
  it('gives 3 for no hints, 2 for one or two, 1 for three or more', () => {
    expect([0, 1, 2, 3, 4, 10].map(starsFor)).toEqual([3, 2, 2, 1, 1, 1]);
  });
});

describe('recordLevel', () => {
  it('moves the current level on and keeps the best stars', () => {
    let p = recordLevel(undefined, 'easy', 1, 2);
    expect(p.easy).toEqual({ currentLevel: 2, stars: { 1: 2 } });
    p = recordLevel(p, 'easy', 2, 3);
    expect(p.easy.currentLevel).toBe(3);
    p = recordLevel(p, 'easy', 1, 1); // replaying level 1 badly: no change in best, no step back
    expect(p.easy).toEqual({ currentLevel: 3, stars: { 1: 2, 2: 3 } });
    p = recordLevel(p, 'easy', 1, 3);
    expect(p.easy.stars[1]).toBe(3);
    expect(p.easy.currentLevel).toBe(3);
  });
  it('keeps the difficulties apart and does not mutate its input', () => {
    const base = defaultPackProgress();
    const p = recordLevel(base, 'hard', 1, 3);
    expect(base.hard.currentLevel).toBe(1);
    expect(p.hard.currentLevel).toBe(2);
    expect(p.easy).toEqual(base.easy);
  });
  it('sums stars over packs and difficulties', () => {
    const a = recordLevel(recordLevel(undefined, 'easy', 1, 3), 'medium', 1, 2);
    const b = recordLevel(undefined, 'hard', 1, 1);
    expect(totalStars({ animals: a, food: b })).toBe(6);
    expect(totalStars({})).toBe(0);
  });
});

describe('recordStats', () => {
  it('counts the puzzle, its words and each word once', () => {
    const puzzle = generatePuzzle({ id: 's', packId: 'animals', difficulty: 'easy', size: 8, seed: 1, words: PACKS[0].words });
    const game = startGame(puzzle, 0);
    const once = recordStats(defaultStats(5), game);
    expect(once.puzzlesCompleted).toBe(1);
    expect(once.wordsFound).toBe(puzzle.words.length);
    expect(Object.values(once.foundWords).every((n) => n === 1)).toBe(true);
    const twice = recordStats(once, game);
    expect(twice.puzzlesCompleted).toBe(2);
    expect(Object.values(twice.foundWords).every((n) => n === 2)).toBe(true);
    expect(twice.firstOpenAt).toBe(5);
  });
});

describe('partOfDay', () => {
  it('splits the day for the greeting', () => {
    expect([0, 5, 11, 12, 17, 18, 23].map(partOfDay)).toEqual(['morning', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening']);
  });
});
