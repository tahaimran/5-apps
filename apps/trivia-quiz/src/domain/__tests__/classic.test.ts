import { fixtureBank } from '@/testing/fixtureBank';
import { CATEGORY_LIST } from '../categories';
import { classicCompletion, currentLevel, hasHearts, isUnlocked, levelCount, levelDifficulty, levelQuestions, levelSpecs, recordLevel, totalStars } from '../classic';
import { defaultClassic } from '../defaults';

const bank = fixtureBank(100);

describe('classic levels', () => {
  it('has 30 levels per category: 1-10 easy, 11-20 medium, 21-30 hard', () => {
    for (const c of CATEGORY_LIST) {
      expect(levelCount(bank, c)).toBe(30);
      expect([1, 10, 11, 20, 21, 30].map((l) => levelDifficulty(bank, c, l))).toEqual([1, 1, 2, 2, 3, 3]);
    }
  });
  it('gives each level 10 distinct questions of its difficulty and never shares one between levels', () => {
    const all = new Set<string>();
    for (let l = 1; l <= 30; l++) {
      const qs = levelQuestions(bank, 'music', l);
      expect(qs).toHaveLength(10);
      expect(new Set(qs.map((q) => q.d)).size).toBe(1);
      for (const q of qs) all.add(q.id);
    }
    expect(all.size).toBe(300);
  });
  it('is the same on every call and stays stable when questions are appended', () => {
    const before = levelQuestions(bank, 'food', 7).map((q) => q.id);
    expect(levelQuestions(fixtureBank(100), 'food', 7).map((q) => q.id)).toEqual(before);
    const grown = fixtureBank(100);
    grown.byCategory.food.push({ id: 'foo-009999', q: 'New easy?', a: ['a', 'b', 'c', 'd'], d: 1, x: 'x', rev: 1 });
    for (let i = 0; i < 9; i++) grown.byCategory.food.push({ id: `foo-0099${i}0`, q: `New easy ${i}?`, a: ['a', 'b', 'c', 'd'], d: 1, x: 'x', rev: 1 });
    expect(levelCount(grown, 'food')).toBe(31);
    for (let l = 1; l <= 30; l++) expect(levelQuestions(grown, 'food', l).map((q) => q.id)).toEqual(levelQuestions(bank, 'food', l).map((q) => q.id));
    expect(levelSpecs(grown, 'food')[30]).toMatchObject({ level: 31, difficulty: 1, chunk: 10 });
  });
  it('has fewer levels when a category is short, and none out of range', () => {
    const small = fixtureBank(25);
    expect(levelCount(small, 'logic')).toBe(6);
    expect(levelQuestions(small, 'logic', 7)).toEqual([]);
    expect(levelDifficulty(small, 'logic', 99)).toBeNull();
  });
  it('gives hard levels from 21 three hearts', () => {
    expect(hasHearts(20)).toBe(false);
    expect(hasHearts(21)).toBe(true);
  });
});

describe('classic progress', () => {
  it('unlocks the next level at 1 star and keeps the best stars and score', () => {
    let p = defaultClassic();
    expect(isUnlocked(p, 1)).toBe(true);
    expect(isUnlocked(p, 2)).toBe(false);
    p = recordLevel(p, 1, 0, 400, 30);
    expect(p.unlocked).toBe(1);
    p = recordLevel(p, 1, 2, 900, 30);
    expect(p).toMatchObject({ unlocked: 2, stars: { 1: 2 }, bestScores: { 1: 900 } });
    p = recordLevel(p, 1, 1, 500, 30);
    expect(p.stars[1]).toBe(2);
    expect(p.bestScores[1]).toBe(900);
    expect(p.unlocked).toBe(2);
  });
  it('never unlocks past the last level', () => {
    expect(recordLevel({ stars: {}, unlocked: 30, bestScores: {} }, 30, 3, 1, 30).unlocked).toBe(30);
  });
  it('finds the level to continue and the completion share', () => {
    let p = defaultClassic();
    expect(currentLevel(p, 30)).toBe(1);
    p = recordLevel(recordLevel(p, 1, 3, 1, 30), 2, 1, 1, 30);
    expect(currentLevel(p, 30)).toBe(3);
    expect(classicCompletion(p, 30)).toBeCloseTo(2 / 30);
    expect(classicCompletion(undefined, 30)).toBe(0);
    expect(totalStars(p)).toBe(4);
  });
});
