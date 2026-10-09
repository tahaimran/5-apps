import type { DueInput } from '@/domain/dueDate';
import { eddFrom } from '@/domain/dueDate';
import type { DueDraft } from '@/components/DueDateForm';
import { draftSavable } from '@/components/DueDateForm';
import type { FirstBaby, Need } from '@/domain/types';
import type { DateKey } from '@/domain/types';

/** What the onboarding steps collect (keys of the shared flow's answers). */
export interface OnboardingAnswers {
  disclaimer?: boolean;
  /** `'later'` is "I'll add this later". */
  howFar?: DueDraft | 'later';
  firstBaby?: FirstBaby;
  needs?: { needs: Need[]; reminder: { on: boolean; hour: number; minute: number } };
}

export interface ResolvedSetup {
  /** The "I understand" box was ticked on screen 2. */
  acknowledged: boolean;
  due: DueInput | null;
  firstBaby: FirstBaby | undefined;
  partnerMode: boolean;
  needs: Need[];
  /** Where the app opens right after (plan §6 "Landing"). */
  landing: '/timer' | '/kicks';
}

/**
 * Turns the collected answers into saved choices. A skipped screen saves nothing for it: no due date, no
 * acknowledgement (the disclaimer sheet comes later on the Timer), no needs. A due date is only taken when the
 * person set it themselves and it passes the plan's limits; a starting date they never touched is dropped.
 */
export function resolveAnswers(answers: Record<string, unknown>, today: DateKey): ResolvedSetup {
  const a = answers as OnboardingAnswers;
  const draft = a.howFar && a.howFar !== 'later' ? a.howFar : null;
  const due: DueInput | null = draft && draftSavable(draft, today) ? { mode: draft.mode, date: draft.date, cycleLength: draft.cycleLength, ivfEmbryoDay: draft.ivfEmbryoDay } : null;
  const needs = a.needs?.needs ?? [];
  return {
    acknowledged: a.disclaimer === true,
    due,
    firstBaby: a.firstBaby,
    partnerMode: a.firstBaby === 'partner',
    needs,
    landing: needs.length === 1 && needs[0] === 'kicks' ? '/kicks' : '/timer',
  };
}

export const dueEdd = (due: DueInput): DateKey => eddFrom(due);
