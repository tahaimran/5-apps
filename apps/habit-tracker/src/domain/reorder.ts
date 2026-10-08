import type { HabitId } from './types';

/**
 * Today only shows some habits (scheduled that day), so a drag moves an item within that
 * visible subset. This keeps the hidden habits where they were and puts the visible ones in
 * the new order, in the slots the visible habits already occupied.
 */
export function applyVisibleReorder(order: HabitId[], visible: HabitId[], from: number, to: number): HabitId[] {
  if (from === to || from < 0 || to < 0 || from >= visible.length || to >= visible.length) return order;
  const moved = [...visible];
  const [item] = moved.splice(from, 1);
  moved.splice(to, 0, item);
  const visibleSet = new Set(visible);
  let next = 0;
  return order.map((id) => (visibleSet.has(id) ? moved[next++] : id));
}

/** Move one habit up or down the full list (used by accessibility actions). */
export function moveInOrder(order: HabitId[], id: HabitId, delta: -1 | 1): HabitId[] {
  const i = order.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= order.length) return order;
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
