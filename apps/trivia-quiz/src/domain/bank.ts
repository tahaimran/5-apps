import { CATEGORY_LIST } from './categories';
import type { CategoryId, Difficulty, Question, QuestionFile, QuestionId } from './types';

/** The questions of every category, indexed for quick lookup. Built from files so tests can use small fixtures. */
export interface Bank {
  version: string;
  /** The major part of the bank version; part of the Daily seed (plan §8). */
  major: number;
  byCategory: Record<CategoryId, Question[]>;
  byId: Map<QuestionId, Question>;
  all: Question[];
}

export const majorOf = (version: string): number => {
  const n = parseInt(version.split('.')[0], 10);
  return Number.isFinite(n) ? n : 1;
};

export function createBank(files: readonly QuestionFile[], version?: string): Bank {
  const byCategory = Object.fromEntries(CATEGORY_LIST.map((c) => [c, [] as Question[]])) as Record<CategoryId, Question[]>;
  const byId = new Map<QuestionId, Question>();
  for (const file of files) {
    for (const q of file.questions) {
      byCategory[file.category].push(q);
      byId.set(q.id, q);
    }
  }
  const all = CATEGORY_LIST.flatMap((c) => byCategory[c]);
  const v = version ?? files[0]?.version ?? '1.0.0';
  return { version: v, major: majorOf(v), byCategory, byId, all };
}

/** Questions of one category at one difficulty, in file order (the order is append-only; plan §8). */
export const poolOf = (bank: Bank, category: CategoryId, d?: Difficulty): Question[] =>
  d === undefined ? bank.byCategory[category] : bank.byCategory[category].filter((q) => q.d === d);
