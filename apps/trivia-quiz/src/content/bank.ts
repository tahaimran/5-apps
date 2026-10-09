import { createBank, type Bank } from '@/domain/bank';
import type { CategoryId, QuestionFile } from '@/domain/types';

/**
 * The bundled question files (plan §9: one file per category, required lazily). Metro needs a literal
 * path in every `require`, so each category has its own loader. `scripts/build-bank.mjs` writes the files.
 */
const loaders: Record<CategoryId, () => QuestionFile> = {
  general: () => require('../../assets/questions/en/general.json'),
  geography: () => require('../../assets/questions/en/geography.json'),
  history: () => require('../../assets/questions/en/history.json'),
  science: () => require('../../assets/questions/en/science.json'),
  movies: () => require('../../assets/questions/en/movies.json'),
  music: () => require('../../assets/questions/en/music.json'),
  sports: () => require('../../assets/questions/en/sports.json'),
  animals: () => require('../../assets/questions/en/animals.json'),
  food: () => require('../../assets/questions/en/food.json'),
  literature: () => require('../../assets/questions/en/literature.json'),
  logic: () => require('../../assets/questions/en/logic.json'),
  flags: () => require('../../assets/questions/en/flags.json'),
};

let bank: Bank | null = null;

/** The whole bank, built on first use (parsing 3,600 small objects takes a few milliseconds). */
export function getBank(): Bank {
  bank ??= createBank(Object.values(loaders).map((load) => load()));
  return bank;
}

/** Tests only: use a small fixture instead of the real files. */
export function setBankForTests(next: Bank | null): void {
  bank = next;
}

/** The installed bank version, shown in Settings ("bank v1.0.3") and kept in `tq.content.version`. */
export const contentVersion = (): string => getBank().version;
