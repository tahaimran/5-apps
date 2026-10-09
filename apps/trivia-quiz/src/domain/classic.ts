import type { Bank } from './bank';
import { poolOf } from './bank';
import type { CategoryId, ClassicProgress, Difficulty, Question, Stars } from './types';

export const QUESTIONS_PER_LEVEL = 10;
/** Plan F1: levels 1-10 easy, 11-20 medium, 21-30 hard. */
export const BASE_LEVELS = 30;
export const LEVELS_PER_TIER = 10;
/** Plan §8: hard levels (21-30) have 3 hearts. */
export const HEARTS_FROM_LEVEL = 21;
export const HEARTS = 3;

export interface LevelSpec {
  level: number;
  difficulty: Difficulty;
  /** Which chunk of 10 inside the difficulty tier. */
  chunk: number;
}

/**
 * The levels of a category: chunks of 10 questions of one difficulty, in file order. The first 100
 * of each tier give levels 1-30 (easy, medium, hard); questions added later by an update become
 * levels 31 onwards, so the ordering of existing levels never changes (plan §8, §10.8).
 */
export function levelSpecs(bank: Bank, category: CategoryId): LevelSpec[] {
  const chunks = ([1, 2, 3] as const).map((d) => Math.floor(poolOf(bank, category, d).length / QUESTIONS_PER_LEVEL));
  const specs: LevelSpec[] = [];
  for (const d of [1, 2, 3] as const) {
    for (let c = 0; c < Math.min(chunks[d - 1], LEVELS_PER_TIER); c++) specs.push({ level: specs.length + 1, difficulty: d, chunk: c });
  }
  for (const d of [1, 2, 3] as const) {
    for (let c = LEVELS_PER_TIER; c < chunks[d - 1]; c++) specs.push({ level: specs.length + 1, difficulty: d, chunk: c });
  }
  return specs;
}

export const levelCount = (bank: Bank, category: CategoryId): number => levelSpecs(bank, category).length;

/** The 10 questions of a level, always the same for a given bank. */
export function levelQuestions(bank: Bank, category: CategoryId, level: number): Question[] {
  const spec = levelSpecs(bank, category)[level - 1];
  if (!spec) return [];
  return poolOf(bank, category, spec.difficulty).slice(spec.chunk * QUESTIONS_PER_LEVEL, (spec.chunk + 1) * QUESTIONS_PER_LEVEL);
}

export const levelDifficulty = (bank: Bank, category: CategoryId, level: number): Difficulty | null =>
  levelSpecs(bank, category)[level - 1]?.difficulty ?? null;

export const hasHearts = (level: number): boolean => level >= HEARTS_FROM_LEVEL;

/** Records a finished level: best stars and score are kept, and 1 star or more unlocks the next level. */
export function recordLevel(progress: ClassicProgress, level: number, stars: Stars, score: number, totalLevels: number): ClassicProgress {
  const bestStars = Math.max(progress.stars[level] ?? 0, stars) as Stars;
  return {
    stars: { ...progress.stars, [level]: bestStars },
    unlocked: stars >= 1 ? Math.min(totalLevels, Math.max(progress.unlocked, level + 1)) : progress.unlocked,
    bestScores: { ...progress.bestScores, [level]: Math.max(progress.bestScores[level] ?? 0, score) },
  };
}

export const isUnlocked = (progress: ClassicProgress, level: number): boolean => level <= progress.unlocked;

/** The level to continue with: the highest unlocked one that has no stars yet (or the last level). */
export function currentLevel(progress: ClassicProgress, totalLevels: number): number {
  for (let l = 1; l <= totalLevels; l++) if (isUnlocked(progress, l) && !(progress.stars[l] ?? 0)) return l;
  return totalLevels;
}

/** Share of levels with at least one star, 0 to 1. */
export function classicCompletion(progress: ClassicProgress | undefined, totalLevels: number): number {
  if (!progress || totalLevels === 0) return 0;
  return Object.values(progress.stars).filter((s) => s >= 1).length / totalLevels;
}

export const totalStars = (progress: ClassicProgress | undefined): number => Object.values(progress?.stars ?? {}).reduce<number>((a, s) => a + s, 0);
