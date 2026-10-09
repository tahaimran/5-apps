import { CATEGORY_LIST } from '@/domain/categories';
import { resolveAnswers, warmupVerdict } from '../answers';

describe('onboarding answers', () => {
  it('uses the picks (3 or more) and the chosen difficulty', () => {
    expect(resolveAnswers({ categories: ['music', 'food', 'logic'], difficulty: 3 })).toEqual({ favoriteCategories: ['music', 'food', 'logic'], preferredDifficulty: 3 });
  });
  it('means all categories and Medium when the steps were skipped, by "skip intro" or by Skip', () => {
    const all = { favoriteCategories: CATEGORY_LIST, preferredDifficulty: 2 };
    expect(resolveAnswers({})).toEqual(all);
    expect(resolveAnswers({ intro: 'skip' })).toEqual(all);
    expect(resolveAnswers({ categories: ['general'] })).toEqual(all);
  });
  it('keeps picks but defaults the difficulty when only the second step was skipped', () => {
    expect(resolveAnswers({ categories: ['music', 'food', 'logic'] })).toEqual({ favoriteCategories: ['music', 'food', 'logic'], preferredDifficulty: 2 });
  });
  it('ignores unknown category ids', () => {
    expect(resolveAnswers({ categories: ['music', 'nope', 'food', 'logic'] }).favoriteCategories).toEqual(['music', 'food', 'logic']);
  });
  it('titles the warm-up result by score', () => {
    expect([3, 2, 1, 0].map(warmupVerdict)).toEqual(['perfect', 'natural', 'start', 'start']);
  });
});
