import { resolveAnswers, type OnboardingAnswers } from './answers';
import { logFunnel } from '@/store/funnel';
import { db } from '@/store/storage';
import { useProfile } from '@/store/stores';

/** Saves the setup choices to the profile. Returns true when "skip intro" was used. */
export function applyOnboardingAnswers(answers: Record<string, unknown>): boolean {
  const setup = resolveAnswers(answers);
  useProfile.getState().update({ favoriteCategories: setup.favoriteCategories, preferredDifficulty: setup.preferredDifficulty });
  const a = answers as OnboardingAnswers;
  if (a.categories) logFunnel('onb_cat_done');
  if (a.difficulty !== undefined) logFunnel('onb_diff_done');
  return a.intro === 'skip';
}

export const clearOnboardingResume = () => db.remove('onboarding.resume');

/** The warm-up was skipped ("skip intro") or could not be built: the result screen is left out. */
export function skipWarmup(): void {
  db.set('onboarding.warmupDone', true);
  db.set('onboarding.warmupScore', -1);
}

/** The whole first-run path is finished (plan §6: `onboarding.done = true`). */
export function markOnboardingDone(): void {
  db.set('onboarding.done', true);
  db.set('coachDone', false); // Home shows its one coach mark
  logFunnel('onb_done');
}
