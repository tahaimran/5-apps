import type { Habit } from './types';

export const NAME_MAX = 40;
export const COUNT_MAX = 999;
export const TIMER_MAX_MINUTES = 600;

export type HabitDraft = Pick<Habit, 'name' | 'icon' | 'color' | 'type' | 'target' | 'schedule' | 'category' | 'createdAt'> &
  Partial<Pick<Habit, 'unit' | 'templateId'>> & {
    /** HH:mm, or null for no reminder. */
    reminderTime: string | null;
  };

export type DraftErrors = Partial<Record<'name' | 'target' | 'days', 'required' | 'tooLong' | 'range'>>;

export function validateDraft(d: HabitDraft): DraftErrors {
  const errors: DraftErrors = {};
  const name = d.name.trim();
  if (name.length === 0) errors.name = 'required';
  else if (name.length > NAME_MAX) errors.name = 'tooLong';

  if (d.type === 'count' && !(Number.isInteger(d.target) && d.target >= 1 && d.target <= COUNT_MAX)) {
    errors.target = 'range';
  }
  if (d.type === 'timer' && !(Number.isInteger(d.target) && d.target >= 1 && d.target <= TIMER_MAX_MINUTES)) {
    errors.target = 'range';
  }
  if (d.schedule.kind === 'weekdays' && d.schedule.days.length === 0) errors.days = 'required';
  return errors;
}

export const isValid = (d: HabitDraft) => Object.keys(validateDraft(d)).length === 0;

/** Yes/no habits always have a target of 1 and no unit. */
export function normalizeDraft(d: HabitDraft): HabitDraft {
  return {
    ...d,
    name: d.name.trim(),
    target: d.type === 'boolean' ? 1 : d.target,
    unit: d.type === 'count' ? d.unit?.trim() || undefined : d.type === 'timer' ? 'min' : undefined,
  };
}
