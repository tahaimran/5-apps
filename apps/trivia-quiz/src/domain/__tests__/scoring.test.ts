import { mulberry32 } from '../prng';
import {
  levelFromXp,
  levelProgress,
  pointsFor,
  present,
  QUESTION_SECONDS,
  starsFor,
  streakMultiplier,
  titleFor,
  xpAtLevel,
  xpFor,
  xpToNext,
} from '../scoring';

describe('points and stars', () => {
  it('scores 100/150/200 plus 5 per remaining second', () => {
    expect(pointsFor(1, 0, 0)).toBe(100);
    expect(pointsFor(2, 10.9, 0)).toBe(150 + 54);
    expect(pointsFor(3, 18, 0)).toBe(200 + 90);
  });
  it('applies the in-round streak bonus after 3 and after 5 correct in a row', () => {
    expect([0, 2, 3, 4, 5, 9].map(streakMultiplier)).toEqual([1, 1, 1.1, 1.1, 1.25, 1.25]);
    expect(pointsFor(1, 0, 5)).toBe(125);
  });
  it('gives 1 star from 5, 2 from 7 and 3 from 9 out of 10', () => {
    expect([0, 4, 5, 6, 7, 8, 9, 10].map((n) => starsFor(n))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
  it('times easy 25 s, medium 20 s and hard 18 s', () => {
    expect(QUESTION_SECONDS).toEqual({ 1: 25, 2: 20, 3: 18 });
  });
});

describe('xp', () => {
  const none = { 1: 0, 2: 0, 3: 0 };
  it('pays 10/15/20 per correct answer, +20 for a level, +30 for the Daily', () => {
    expect(xpFor({ correctByDifficulty: { 1: 2, 2: 2, 3: 1 }, levelCompleted: false, dailyCompleted: false, relaxed: false, doubled: false })).toBe(70);
    expect(xpFor({ correctByDifficulty: none, levelCompleted: true, dailyCompleted: false, relaxed: false, doubled: false })).toBe(20);
    expect(xpFor({ correctByDifficulty: none, levelCompleted: false, dailyCompleted: true, relaxed: false, doubled: false })).toBe(30);
  });
  it('relaxed mode pays x0.8 and double XP doubles the result', () => {
    expect(xpFor({ correctByDifficulty: { 1: 10, 2: 0, 3: 0 }, levelCompleted: false, dailyCompleted: false, relaxed: true, doubled: false })).toBe(80);
    expect(xpFor({ correctByDifficulty: { 1: 10, 2: 0, 3: 0 }, levelCompleted: false, dailyCompleted: false, relaxed: false, doubled: true })).toBe(200);
  });
  it('needs round(100 x L^1.5) to leave level L', () => {
    expect([1, 2, 3, 4].map(xpToNext)).toEqual([100, 283, 520, 800]);
    expect(xpAtLevel(1)).toBe(0);
    expect(xpAtLevel(3)).toBe(383);
  });
  it('finds the level of an XP total and the progress inside it', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(382)).toBe(2);
    expect(levelFromXp(383)).toBe(3);
    expect(levelProgress(150)).toEqual({ level: 2, into: 50, need: 283, fraction: 50 / 283 });
    expect(levelFromXp(-5)).toBe(1);
  });
  it('maps levels to titles', () => {
    expect([1, 4, 5, 9, 10, 19, 20, 34, 35, 80].map(titleFor)).toEqual(['curious', 'curious', 'quizzer', 'quizzer', 'brainiac', 'brainiac', 'scholar', 'scholar', 'legend', 'legend']);
  });
});

describe('present', () => {
  it('always puts the right answer where correctIndex says, over many seeds', () => {
    const q = { id: 'x-000001', q: 'Q?', a: ['right', 'b', 'c', 'd'] as [string, string, string, string], d: 1 as const, x: 'x', rev: 1 };
    const spots = new Set<number>();
    for (let s = 0; s < 200; s++) {
      const p = present(q, mulberry32(s));
      expect(p.correctIndex).toBeGreaterThanOrEqual(0);
      expect(p.correctIndex).toBeLessThanOrEqual(3);
      expect(p.options[p.correctIndex]).toBe('right');
      expect([...p.options].sort()).toEqual(['b', 'c', 'd', 'right']);
      spots.add(p.correctIndex);
    }
    expect(spots.size).toBe(4);
  });
});
