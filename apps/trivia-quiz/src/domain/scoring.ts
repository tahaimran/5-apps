import type { Difficulty, Presented, Question, Stars } from './types';
import type { Rng } from './prng';
import { shuffled } from './prng';

/** Plan §8: points per correct answer by difficulty. */
export const BASE_POINTS: Record<Difficulty, number> = { 1: 100, 2: 150, 3: 200 };
export const XP_PER_CORRECT: Record<Difficulty, number> = { 1: 10, 2: 15, 3: 20 };
export const XP_LEVEL_COMPLETE = 20;
export const XP_DAILY = 30;
export const XP_WARMUP = 30;
export const RELAXED_XP_FACTOR = 0.8;
export const DOUBLE_XP_PER_DAY = 3;

/** Seconds per question: 20, easy 25, hard 18 (plan §8). */
export const QUESTION_SECONDS: Record<Difficulty, number> = { 1: 25, 2: 20, 3: 18 };
export const BLITZ_SECONDS = 60;
export const BLITZ_CORRECT_BONUS = 1;
export const BLITZ_WRONG_PENALTY = 3;
export const EXTRA_TIME_SECONDS = 15;
export const BLITZ_EXTRA_TIME_SECONDS = 10;

/** In-round streak multiplier: x1.1 after 3 correct in a row, x1.25 after 5 (plan §8). */
export const streakMultiplier = (runBefore: number): number => (runBefore >= 5 ? 1.25 : runBefore >= 3 ? 1.1 : 1);

/** Points for one correct answer: base + floor(remainingSec x 5), times the streak multiplier. */
export function pointsFor(d: Difficulty, remainingSec: number, runBefore: number): number {
  const bonus = Math.floor(Math.max(0, remainingSec) * 5);
  return Math.round((BASE_POINTS[d] + bonus) * streakMultiplier(runBefore));
}

/** Plan F1: 1 star from 5 of 10, 2 from 7, 3 from 9. */
export function starsFor(correct: number, total: number = 10): Stars {
  const share = (correct / total) * 10;
  return share >= 9 ? 3 : share >= 7 ? 2 : share >= 5 ? 1 : 0;
}

export const STARS_TO_PASS = 5;

export interface XpInput {
  correctByDifficulty: Record<Difficulty, number>;
  levelCompleted: boolean;
  dailyCompleted: boolean;
  relaxed: boolean;
  doubled: boolean;
}

/** XP for a round: per correct answer by difficulty, +20 for a level, +30 for the Daily; relaxed x0.8; doubled x2. */
export function xpFor(i: XpInput): number {
  let xp = i.correctByDifficulty[1] * XP_PER_CORRECT[1] + i.correctByDifficulty[2] * XP_PER_CORRECT[2] + i.correctByDifficulty[3] * XP_PER_CORRECT[3];
  if (i.levelCompleted) xp += XP_LEVEL_COMPLETE;
  if (i.dailyCompleted) xp += XP_DAILY;
  if (i.relaxed) xp *= RELAXED_XP_FACTOR;
  xp = Math.round(xp);
  return i.doubled ? xp * 2 : xp;
}

/** XP needed to go from level L to L+1: round(100 x L^1.5) (plan §8). */
export const xpToNext = (level: number): number => Math.round(100 * level ** 1.5);

/** Total XP at which a level starts (level 1 starts at 0). */
export function xpAtLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNext(l);
  return total;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let need = xpToNext(1);
  let left = Math.max(0, xp);
  while (left >= need) {
    left -= need;
    level++;
    need = xpToNext(level);
  }
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside this level. */
  into: number;
  /** XP this level needs. */
  need: number;
  /** 0 to 1. */
  fraction: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const into = Math.max(0, xp) - xpAtLevel(level);
  const need = xpToNext(level);
  return { level, into, need, fraction: Math.min(1, into / need) };
}

export type TitleKey = 'curious' | 'quizzer' | 'brainiac' | 'scholar' | 'legend';

/** Plan §8 titles: Curious 1-4, Quizzer 5-9, Brainiac 10-19, Scholar 20-34, Trivia Legend 35+. */
export const titleFor = (level: number): TitleKey =>
  level >= 35 ? 'legend' : level >= 20 ? 'scholar' : level >= 10 ? 'brainiac' : level >= 5 ? 'quizzer' : 'curious';

/** Shuffles a question's options with the rng; `correctIndex` says where the right one (a[0]) went. */
export function present(q: Question, rng: Rng): Presented {
  const order = shuffled(rng, [0, 1, 2, 3]);
  return { question: q, options: order.map((i) => q.a[i]), correctIndex: order.indexOf(0) };
}
