import { MIN_PER_DAY } from './dayKey';
import type { MinuteOfDay, QuietBlock, ReminderSettings } from './types';
import { clamp, roundTo } from './units';

export const MIN_REMINDERS = 4;
export const MAX_REMINDERS = 16;
/** First reminder this long after waking, last one this long before bed. */
export const EDGE_MARGIN_MIN = 30;

/** True when `minute` (any value, taken modulo 24 h) falls inside a quiet block. A block may wrap midnight. */
export function inQuietBlock(minute: MinuteOfDay, blocks: QuietBlock[]): boolean {
  const m = ((minute % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  return blocks.some((b) => (b.startMin <= b.endMin ? m >= b.startMin && m < b.endMin : m >= b.startMin || m < b.endMin));
}

/** How many reminders a day has, before quiet blocks remove any (plan §8.2). */
export function reminderCount(s: ReminderSettings, goalMl: number, cupMl: number): number {
  const { start, end } = window(s);
  if (s.frequency === 'smart') return clamp(Math.ceil(goalMl / Math.max(1, cupMl)), MIN_REMINDERS, MAX_REMINDERS);
  return clamp(Math.floor((end - start) / s.intervalMin) + 1, 2, MAX_REMINDERS);
}

/** Wake + 30 min to bed - 30 min, in minutes from the wake-up date's midnight (may run past 1440). */
export function window(s: Pick<ReminderSettings, 'wakeMin' | 'bedMin'>): { start: number; end: number } {
  const start = s.wakeMin + EDGE_MARGIN_MIN;
  let end = s.bedMin - EDGE_MARGIN_MIN;
  if (end <= start) end += MIN_PER_DAY; // bedtime after midnight (night shift)
  return { start, end };
}

/**
 * Reminder times for one waking day, as minutes from the wake-up date's midnight. A slot after
 * midnight keeps its offset past 1440 so the caller can place it on the right calendar day.
 * Slots that land in a quiet block are dropped.
 */
export function buildSlots(s: ReminderSettings, goalMl: number, cupMl: number): MinuteOfDay[] {
  const { start, end } = window(s);
  const span = end - start;
  const n = reminderCount(s, goalMl, cupMl);
  const step = n > 1 ? span / (n - 1) : 0;
  const slots = Array.from({ length: n }, (_, i) => roundTo(start + i * step, 5));
  return [...new Set(slots)].filter((m) => !inQuietBlock(m, s.quietBlocks));
}
