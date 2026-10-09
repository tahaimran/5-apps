import { CATEGORY_LIST } from '@/domain/categories';
import type { CategoryId, Difficulty } from '@/domain/types';

/** What the onboarding steps collect (keys of the shared flow's answers). */
export interface OnboardingAnswers {
  categories?: CategoryId[];
  difficulty?: Difficulty;
  /** "I've played before - skip intro" was pressed on the first screen. */
  intro?: 'skip';
}

export const MIN_CATEGORIES = 3;
/** Plan §6 O2: General Knowledge is pre-selected. */
export const DEFAULT_PICKS: CategoryId[] = ['general'];
export const DEFAULT_DIFFICULTY: Difficulty = 2;

export interface ResolvedSetup {
  favoriteCategories: CategoryId[];
  preferredDifficulty: Difficulty;
}

/**
 * Plan §6 defaults: a skipped or unfinished category step means all categories, a skipped difficulty
 * step means Medium. Fewer than 3 picks (only possible by skipping) also means all.
 */
export function resolveAnswers(answers: Record<string, unknown>): ResolvedSetup {
  const a = answers as OnboardingAnswers;
  const picks = (a.categories ?? []).filter((c): c is CategoryId => (CATEGORY_LIST as string[]).includes(c));
  return {
    favoriteCategories: picks.length >= MIN_CATEGORIES ? picks : [...CATEGORY_LIST],
    preferredDifficulty: a.difficulty ?? DEFAULT_DIFFICULTY,
  };
}

export type WarmupVerdict = 'perfect' | 'natural' | 'start';

/** Plan §6 O5: 3 of 3 "Perfect start", 2 of 3 "Nice! You're a natural.", 0-1 "Everyone starts somewhere." */
export const warmupVerdict = (correct: number): WarmupVerdict => (correct >= 3 ? 'perfect' : correct === 2 ? 'natural' : 'start');
