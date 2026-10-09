/**
 * The hospital bag and birth plan checklists (plan F13, F14) as pure functions: build from the bundled
 * content, check, add, delete, reorder, progress, and add the items of an unlocked template.
 */
import checklistContent from '../../assets/content/checklists.en.json';
import { newId } from './session';
import type { Checklist, ChecklistId, ChecklistItem } from './types';

export interface ContentGroup {
  group: string;
  items: string[];
}
export interface ContentTemplate {
  id: string;
  checklist: ChecklistId;
  groups: ContentGroup[];
}
export const CHECKLIST_CONTENT = checklistContent as { hospitalBag: ContentGroup[]; birthPlan: ContentGroup[]; templates: ContentTemplate[] };
export const TEMPLATE_IDS = CHECKLIST_CONTENT.templates.map((t) => t.id);

const itemsOf = (prefix: string, groups: ContentGroup[]): ChecklistItem[] =>
  groups.flatMap((g) => g.items.map((label, i) => ({ id: `${prefix}.${g.group}.${i}`, label, checked: false, group: g.group })));

/** A fresh list with the prefilled items (plan F13 / F14), none checked. */
export function buildChecklist(id: ChecklistId, now: number): Checklist {
  return { id, items: itemsOf(id, CHECKLIST_CONTENT[id]), updatedAt: now };
}

const touch = (c: Checklist, items: ChecklistItem[], now: number): Checklist => ({ ...c, items, updatedAt: now });

export const toggleItem = (c: Checklist, itemId: string, now: number): Checklist =>
  touch(c, c.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)), now);

/** Adds the person's own item at the end of a group. Blank text adds nothing. */
export function addItem(c: Checklist, group: string, label: string, now: number, makeId: () => string = newId): Checklist {
  const text = label.trim();
  if (!text) return c;
  const lastInGroup = c.items.map((i, idx) => (i.group === group ? idx : -1)).filter((i) => i >= 0).pop();
  const item: ChecklistItem = { id: makeId(), label: text, checked: false, group, custom: true };
  const items = [...c.items];
  items.splice(lastInGroup === undefined ? items.length : lastInGroup + 1, 0, item);
  return touch(c, items, now);
}

export const removeItem = (c: Checklist, itemId: string, now: number): Checklist => touch(c, c.items.filter((i) => i.id !== itemId), now);

/** Moves an item one place up or down, within its own group (the order of the groups never changes). */
export function moveItem(c: Checklist, itemId: string, direction: 'up' | 'down', now: number): Checklist {
  const from = c.items.findIndex((i) => i.id === itemId);
  if (from < 0) return c;
  const group = c.items[from].group;
  const step = direction === 'up' ? -1 : 1;
  let to = from + step;
  while (to >= 0 && to < c.items.length && c.items[to].group !== group) to += step;
  if (to < 0 || to >= c.items.length) return c;
  const items = [...c.items];
  [items[from], items[to]] = [items[to], items[from]];
  return touch(c, items, now);
}

/** Checked and total, and the whole-number percentage (0 for an empty list). */
export function progressOf(c: Checklist): { checked: number; total: number; percent: number } {
  const total = c.items.length;
  const checked = c.items.filter((i) => i.checked).length;
  return { checked, total, percent: total === 0 ? 0 : Math.round((checked / total) * 100) };
}

/** Groups in the order they first appear, each with its items. */
export function groupsOf(c: Checklist): { group: string; items: ChecklistItem[] }[] {
  const order: string[] = [];
  for (const i of c.items) if (!order.includes(i.group)) order.push(i.group);
  return order.map((group) => ({ group, items: c.items.filter((i) => i.group === group) }));
}

/** Adds an unlocked template's items to the end of their groups. Adding it twice adds nothing the second time. */
export function applyTemplate(c: Checklist, templateId: string, now: number): Checklist {
  const template = CHECKLIST_CONTENT.templates.find((t) => t.id === templateId);
  if (!template || template.checklist !== c.id) return c;
  let next = c;
  for (const g of template.groups) {
    g.items.forEach((label, i) => {
      const id = `tpl.${templateId}.${g.group}.${i}`;
      if (next.items.some((it) => it.id === id)) return;
      const item: ChecklistItem = { id, label, checked: false, group: g.group };
      const items = [...next.items];
      const last = items.map((it, idx) => (it.group === g.group ? idx : -1)).filter((idx) => idx >= 0).pop();
      items.splice(last === undefined ? items.length : last + 1, 0, item);
      next = { ...next, items };
    });
  }
  return touch(next, next.items, now);
}

/** Plain text for sharing (plan F14: "export as text along with summary"). */
export function checklistText(c: Checklist, heading: string, groupName: (g: string) => string, checkedMark: string, openMark: string): string {
  const lines = [heading];
  for (const { group, items } of groupsOf(c)) {
    lines.push('', groupName(group));
    for (const i of items) lines.push(`  ${i.checked ? checkedMark : openMark} ${i.label}`);
  }
  return lines.join('\n');
}
