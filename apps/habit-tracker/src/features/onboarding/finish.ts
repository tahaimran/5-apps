import type { Answers } from '@shared/onboarding';
import { templateById, type GoalId } from '@/data/templates';
import { dayKeyFor } from '@/domain/dayKey';
import { draftFromTemplate } from '@/features/habit-editor/drafts';
import { useHabits } from '@/store/habits';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import type { ReminderAnswer } from './steps';

/**
 * Creates what the user picked in onboarding and marks it done. Skipping anywhere keeps whatever
 * was chosen so far; with no habits chosen Today shows its template quick-adds. Returns how many
 * habits were created.
 */
export function applyOnboardingAnswers(answers: Answers): number {
  const { dayEndsAtHour } = useSettings.getState().settings;
  const today = dayKeyFor(new Date(), dayEndsAtHour);
  const reminder = (answers.reminder as ReminderAnswer | undefined) ?? { mode: 'suggested' };
  let created = 0;

  for (const id of (answers.starters as string[] | undefined) ?? []) {
    const template = templateById(id);
    if (!template) continue;
    const draft = draftFromTemplate(template, today);
    if (reminder.mode === 'none') draft.reminderTime = null;
    else if (reminder.mode === 'preset' || reminder.mode === 'custom') draft.reminderTime = reminder.time;
    useHabits.getState().addHabit(draft);
    created++;
  }
  useProfile.getState().update({ goals: (answers.goals as GoalId[] | undefined) ?? [], onboardingDone: true });
  return created;
}
