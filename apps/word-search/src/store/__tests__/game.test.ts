import { mockDisk } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { generatePuzzle, wordCells } from '@/domain/generator';
import { PACKS } from '@/domain/packs';
import { levelPuzzle } from '@/domain/puzzles';
import type { Cell } from '@/domain/selection';
import type { Puzzle } from '@/domain/types';
import { useGame } from '../game';
import { useProgress } from '../progress';
import { useResult } from '../result';
import { useStats } from '../stats';
import { db } from '../storage';

beforeEach(() => {
  resetApp();
  jest.useFakeTimers({ now: 1_000_000 });
});
afterEach(() => jest.useRealTimers());

const cellsOf = (p: Puzzle, i: number): Cell[] => wordCells(p.words[i], p.size).map((n) => ({ row: Math.floor(n / p.size), col: n % p.size }));

describe('game store: autosave and resume (plan §9)', () => {
  it('saves after every found word and resumes exactly', () => {
    const puzzle = levelPuzzle('animals', 'easy', 1, 8);
    useGame.getState().begin(puzzle);
    useGame.getState().select(cellsOf(puzzle, 0));
    useGame.getState().select(cellsOf(puzzle, 1));
    const saved = db.get('current');
    expect(saved?.puzzle.words.filter((w) => w.found)).toHaveLength(2);
    // a new process: the store reads what is on disk
    useGame.setState({ current: db.get('current') ?? null, activeSince: null });
    const resumed = useGame.getState().resume('animals:easy:1');
    expect(resumed).toEqual(saved);
    expect(resumed?.puzzle.grid).toEqual(puzzle.grid);
  });

  it('does not save a wrong selection, and tells the caller', () => {
    const puzzle = levelPuzzle('animals', 'easy', 1, 8);
    useGame.getState().begin(puzzle);
    const before = db.get('current');
    const out = useGame.getState().select([{ row: 0, col: 0 }, { row: 0, col: 1 }]);
    expect(out?.result.kind).toBe('invalid');
    expect(db.get('current')).toEqual(before);
  });

  it('resumes only the puzzle that was saved', () => {
    useGame.getState().begin(levelPuzzle('animals', 'easy', 1, 8));
    expect(useGame.getState().resume('animals:easy:2')).toBeNull();
    expect(useGame.getState().resume('animals:easy:1')).not.toBeNull();
    expect(useGame.getState().select([])).not.toBeNull();
  });

  it('has nothing to select or pause with no puzzle', () => {
    expect(useGame.getState().select([])).toBeNull();
    useGame.getState().pause();
    expect(useGame.getState().finish()).toBeNull();
  });

  it('adds the active time when paused and not when already paused', () => {
    useGame.getState().begin(levelPuzzle('animals', 'easy', 1, 8));
    jest.setSystemTime(1_000_000 + 65_000);
    useGame.getState().pause();
    expect(useGame.getState().current?.elapsedMs).toBe(65_000);
    jest.setSystemTime(1_000_000 + 200_000);
    useGame.getState().pause(); // already paused: no time while away
    expect(useGame.getState().current?.elapsedMs).toBe(65_000);
    useGame.getState().resume('animals:easy:1');
    jest.setSystemTime(1_000_000 + 210_000);
    useGame.getState().pause();
    expect(useGame.getState().current?.elapsedMs).toBe(75_000);
    expect(db.get('current')?.elapsedMs).toBe(75_000);
  });
});

describe('game store: finishing a puzzle', () => {
  const solve = (id = 'animals:easy:1') => {
    const puzzle = levelPuzzle('animals', 'easy', 1, 8);
    useGame.getState().begin(puzzle);
    for (let i = 0; i < puzzle.words.length; i++) useGame.getState().select(cellsOf(puzzle, i));
    void id;
    return puzzle;
  };

  it('records stars, moves the level on, counts stats and clears the save', () => {
    const puzzle = solve();
    jest.setSystemTime(1_000_000 + 90_000);
    const result = useGame.getState().finish()!;
    expect(result).toMatchObject({ puzzleId: 'animals:easy:1', packId: 'animals', difficulty: 'easy', level: 1, stars: 3, wordsFound: puzzle.words.length, isDaily: false, isTutorial: false, elapsedMs: 90_000 });
    expect(useProgress.getState().packs.animals.easy).toEqual({ currentLevel: 2, stars: { 1: 3 } });
    expect(useStats.getState().stats.puzzlesCompleted).toBe(1);
    expect(useGame.getState().current).toBeNull();
    expect(db.get('current')).toBeNull();
    expect(db.get('progress.packs')?.animals.easy.currentLevel).toBe(2);
    expect(useResult.getState().last).toEqual(result);
  });

  it('gives fewer stars for hints', () => {
    solve();
    useGame.setState({ current: { ...useGame.getState().current!, hintsUsed: 1 } });
    expect(useGame.getState().finish()!.stars).toBe(2);
    solve();
    useGame.setState({ current: { ...useGame.getState().current!, hintsUsed: 4 } });
    expect(useGame.getState().finish()!.stars).toBe(1);
    expect(useProgress.getState().packs.animals.easy.stars[1]).toBe(2); // the best of the two runs
  });

  it('counts the tutorial without touching pack progress', () => {
    const tutorial = generatePuzzle({ id: 'tutorial', packId: 'animals', difficulty: 'easy', size: 6, seed: 1, words: ['CAT', 'DOG', 'COW', 'HEN'], wordCount: 4 });
    useGame.getState().begin(tutorial);
    const result = useGame.getState().finish()!;
    expect(result.isTutorial).toBe(true);
    expect(result.level).toBeUndefined();
    expect(useProgress.getState().packs).toEqual({});
    expect(useStats.getState().stats.puzzlesCompleted).toBe(1);
  });

  it('can throw a puzzle away', () => {
    useGame.getState().begin(levelPuzzle('birds', 'easy', 3, 8));
    useGame.getState().discard();
    expect(useGame.getState().current).toBeNull();
    expect(db.get('current')).toBeNull();
  });
});

describe('progress and stats stores', () => {
  it('persist and reset', () => {
    useProgress.getState().record('food', 'hard', 4, 2);
    expect(JSON.parse(String(mockDisk.get('ws')!.get('progress.packs'))).food.hard).toEqual({ currentLevel: 5, stars: { 4: 2 } });
    useProgress.getState().reset();
    expect(useProgress.getState().packs).toEqual({});
    useStats.getState().recordSession();
    expect(useStats.getState().stats.sessions).toBe(1);
    useStats.getState().reset();
    expect(useStats.getState().stats.sessions).toBe(0);
    expect(PACKS.length).toBeGreaterThan(0);
  });
});
