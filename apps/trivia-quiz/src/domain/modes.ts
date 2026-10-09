import type { Bank } from './bank';
import { poolOf } from './bank';
import { CATEGORY_LIST } from './categories';
import { hasHearts, HEARTS, levelDifficulty, levelQuestions } from './classic';
import { dailySet } from './daily';
import { mulberry32, shuffled, type Rng } from './prng';
import type { RoundConfig } from './round';
import { pickQuestions } from './selector';
import type { CategoryId, DateKey, Difficulty, Question, QuestionId, SeenEntry } from './types';

export const ROUND_SIZE = 10;
export const WARMUP_SIZE = 3;
export const BLITZ_QUEUE = 90;
const RESERVE = 3;

type Seen = Readonly<Record<QuestionId, SeenEntry>>;

interface Common {
  bank: Bank;
  seed: number;
  relaxed: boolean;
}

/** Spares for Skip: same category and difficulty, never part of the round, preferring unseen ones. */
function spares(bank: Bank, category: CategoryId, d: Difficulty, taken: Set<QuestionId>, seen: Seen, today: number, rng: Rng): Question[] {
  return pickQuestions({ pool: poolOf(bank, category, d), count: RESERVE, seen, today, rng, exclude: taken });
}

/** Classic level N of a category: the fixed 10 questions of the level (plan §8). Hard levels get 3 hearts. */
export function buildClassic(c: Common & { category: CategoryId; level: number; seen: Seen; today: number }): RoundConfig | null {
  const questions = levelQuestions(c.bank, c.category, c.level);
  const d = levelDifficulty(c.bank, c.category, c.level);
  if (questions.length === 0 || d === null) return null;
  const rng = mulberry32(c.seed);
  return {
    mode: 'classic',
    category: c.category,
    level: c.level,
    difficulty: d,
    questions,
    reserve: spares(c.bank, c.category, d, new Set(questions.map((q) => q.id)), c.seen, c.today, rng),
    seed: c.seed,
    relaxed: c.relaxed,
    hearts: hasHearts(c.level) ? HEARTS : 0,
  };
}

/** Category play: 10 questions of a category and difficulty, unseen first, then spaced rotation (plan F3, §8). */
export function buildCategory(c: Common & { category: CategoryId; difficulty: Difficulty; seen: Seen; today: number }): RoundConfig {
  const rng = mulberry32(c.seed);
  const pool = poolOf(c.bank, c.category, c.difficulty);
  const questions = pickQuestions({ pool, count: ROUND_SIZE, seen: c.seen, today: c.today, rng });
  return {
    mode: 'category',
    category: c.category,
    difficulty: c.difficulty,
    questions,
    reserve: spares(c.bank, c.category, c.difficulty, new Set(questions.map((q) => q.id)), c.seen, c.today, rng),
    seed: c.seed,
    relaxed: c.relaxed,
    hearts: 0,
  };
}

/** Difficulty of the n-th Blitz question: it starts easy and ramps up. */
export const blitzDifficulty = (n: number): Difficulty => (n < 8 ? 1 : n < 22 ? 2 : 3);

/** Timed Blitz: a long queue across all categories whose difficulty ramps (the run ends on the clock). */
export function buildBlitz(c: Common & { seen: Seen; today: number }): RoundConfig {
  const rng = mulberry32(c.seed);
  const taken = new Set<QuestionId>();
  const questions: Question[] = [];
  const order = shuffled(rng, CATEGORY_LIST);
  for (let n = 0; n < BLITZ_QUEUE; n++) {
    const category = order[n % order.length];
    const d = blitzDifficulty(n);
    const [q] = pickQuestions({ pool: poolOf(c.bank, category, d), count: 1, seen: c.seen, today: c.today, rng, exclude: taken });
    if (q) {
      taken.add(q.id);
      questions.push(q);
    }
  }
  return { mode: 'blitz', questions, reserve: [], seed: c.seed, relaxed: false, hearts: 0 };
}

/** The Daily Challenge of a date: identical for everyone (plan F2). Relaxed mode is allowed, it only drops the timer. */
export function buildDaily(c: Common & { date: DateKey }): RoundConfig {
  const set = dailySet(c.bank, c.date);
  return {
    mode: 'daily',
    date: c.date,
    questions: set.questions,
    reserve: [set.reserve[1], set.reserve[2], set.reserve[3]],
    seed: c.seed,
    relaxed: c.relaxed,
    hearts: 0,
  };
}

/** Onboarding warm-up: 3 easy questions from the favourite categories, no timer, no lifelines, no ads (plan §6 O4). */
export function buildWarmup(c: Common & { favorites: readonly CategoryId[] }): RoundConfig {
  const rng = mulberry32(c.seed);
  const cats = shuffled(rng, c.favorites.length ? [...c.favorites] : CATEGORY_LIST);
  const taken = new Set<QuestionId>();
  const questions: Question[] = [];
  for (let n = 0; n < WARMUP_SIZE; n++) {
    const [q] = pickQuestions({ pool: poolOf(c.bank, cats[n % cats.length], 1), count: 1, seen: {}, today: 0, rng, exclude: taken });
    if (q) {
      taken.add(q.id);
      questions.push(q);
    }
  }
  return { mode: 'warmup', questions, reserve: [], seed: c.seed, relaxed: true, hearts: 0 };
}
