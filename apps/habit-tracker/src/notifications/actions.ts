import { dayKeyFor } from '@/domain/dayKey';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';

export const DONE_ACTION = 'done';

/**
 * The "Done ✓" button on a yes/no reminder. It checks off today, and is ignored for a reminder
 * that belongs to another day so a late tap never ticks off the wrong one.
 * Returns whether anything changed.
 */
export function completeFromNotification(data: Record<string, unknown> | undefined): boolean {
  const habitId = typeof data?.habitId === 'string' ? data.habitId : undefined;
  if (!habitId) return false;
  const habit = useHabits.getState().habits[habitId];
  if (!habit || habit.archivedAt || habit.type !== 'boolean') return false;
  const today = dayKeyFor(new Date(), useSettings.getState().settings.dayEndsAtHour);
  if (typeof data?.day === 'string' && data.day !== today) return false;
  useHabits.getState().setValue(habitId, today, 1);
  return true;
}
