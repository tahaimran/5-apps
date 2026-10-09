import { create } from 'zustand';
import { addItem, applyTemplate, buildChecklist, moveItem, removeItem, toggleItem } from '@/domain/checklists';
import type { Checklist, ChecklistId } from '@/domain/types';
import { db } from './storage';

type Lists = Partial<Record<ChecklistId, Checklist>>;

interface ChecklistsState {
  lists: Lists;
  /** The list, built from the bundled content the first time it is opened. */
  ensure: (id: ChecklistId) => Checklist;
  toggle: (id: ChecklistId, itemId: string) => void;
  add: (id: ChecklistId, group: string, label: string) => void;
  remove: (id: ChecklistId, itemId: string) => void;
  move: (id: ChecklistId, itemId: string, direction: 'up' | 'down') => void;
  addTemplate: (id: ChecklistId, templateId: string) => void;
  reset: () => void;
}

/** Hospital bag and birth plan (`ct.checklists`). */
export const useChecklists = create<ChecklistsState>((set, get) => {
  const write = (lists: Lists) => {
    db.set('checklists', lists);
    set({ lists });
  };
  const change = (id: ChecklistId, fn: (c: Checklist) => Checklist) => {
    const current = get().ensure(id);
    write({ ...get().lists, [id]: fn(current) });
  };
  return {
    lists: db.get('checklists') ?? {},
    ensure: (id) => {
      const existing = get().lists[id];
      if (existing) return existing;
      const built = buildChecklist(id, Date.now());
      write({ ...get().lists, [id]: built });
      return built;
    },
    toggle: (id, itemId) => change(id, (c) => toggleItem(c, itemId, Date.now())),
    add: (id, group, label) => change(id, (c) => addItem(c, group, label, Date.now())),
    remove: (id, itemId) => change(id, (c) => removeItem(c, itemId, Date.now())),
    move: (id, itemId, direction) => change(id, (c) => moveItem(c, itemId, direction, Date.now())),
    addTemplate: (id, templateId) => change(id, (c) => applyTemplate(c, templateId, Date.now())),
    reset: () => {
      db.remove('checklists');
      set({ lists: {} });
    },
  };
});
