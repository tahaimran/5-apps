import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { resolveAnswers, type OnboardingAnswers } from './answers';
import { defaultWeightUnit } from './locale';

/**
 * Saves what onboarding learned into the settings stores. Safe to call more than once (the first
 * glass step calls it before logging, and finishing calls it again), and with no answers at all
 * (everything skipped), which saves the plan's defaults.
 */
export function applyOnboardingAnswers(answers: OnboardingAnswers): void {
  const r = resolveAnswers(answers, defaultWeightUnit());
  const s = useSettings.getState();
  s.setProfile(r.profile);
  s.setGoal(r.goal);
  s.setReminders(r.reminders);
  s.setCups(r.cups);
  s.setPrefs({ preferredCupId: r.preferredCupId });
}

export const clearOnboardingResume = () => db.remove('onboarding:resume');
