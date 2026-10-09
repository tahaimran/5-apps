import { buildChecklist } from '@/domain/checklists';
import type { Checklist, ChecklistId } from '@/domain/types';
import { useChecklists } from '@/store/checklists';

const untouched: Partial<Record<ChecklistId, Checklist>> = {};

/** The list to draw: what is saved, or the prefilled one while nothing has been changed yet (reading never writes). */
export function useChecklist(id: ChecklistId): Checklist {
  const stored = useChecklists((s) => s.lists[id]);
  return stored ?? (untouched[id] ??= buildChecklist(id, 0));
}
