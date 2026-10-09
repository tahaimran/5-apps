import { createBank, type Bank } from '@/domain/bank';
import { CATEGORY_LIST } from '@/domain/categories';
import { ID_PREFIX } from '@/content/validate';
import type { Difficulty, Question, QuestionFile } from '@/domain/types';

/** A synthetic bank for engine tests: `perTier` questions per category and difficulty, ids in file order. */
export function fixtureBank(perTier = 100, version = '1.0.0'): Bank {
  const files: QuestionFile[] = CATEGORY_LIST.map((category) => {
    const questions: Question[] = [];
    let n = 1;
    for (const d of [1, 2, 3] as Difficulty[]) {
      for (let i = 0; i < perTier; i++, n++) {
        questions.push({
          id: `${ID_PREFIX[category]}-${String(n).padStart(6, '0')}`,
          q: `Fixture ${category} ${d} ${i} question?`,
          a: [`${category}-${n}-right`, `${category}-${n}-w1`, `${category}-${n}-w2`, `${category}-${n}-w3`],
          d,
          x: `Fact ${n}.`,
          rev: 1,
        });
      }
    }
    return { category, locale: 'en', version, questions };
  });
  return createBank(files, version);
}
