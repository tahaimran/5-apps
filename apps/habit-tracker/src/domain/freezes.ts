import type { DayKey, Entry, FreezeState, Habit, HabitId } from './types';
import { addDays, startOfWeek } from './dayKey';
import { isScheduledOn } from './schedule';
import { dayStatus, streakBefore, weekCount, type Entries } from './streaks';

export const MAX_FREEZES = 2;
const MAX_RETRO_DAYS = 2;
const LOG_LIMIT = 100;

export const emptyFreezes: FreezeState = { count: 0, log: [] };

type FreezeHabit = Pick<Habit, 'id' | 'type' | 'target' | 'schedule' | 'createdAt' | 'archivedAt'>;

const withLog = (f: FreezeState, day: DayKey, source: FreezeState['log'][number]['source']) =>
  [...f.log, { day, source }].slice(-LOG_LIMIT);

/** One freeze per calendar day from a rewarded ad, up to the inventory cap. */
export function canEarnFromAd(f: FreezeState, today: DayKey): boolean {
  return f.count < MAX_FREEZES && f.lastAdEarnDay !== today;
}

export function earnFromAd(f: FreezeState, today: DayKey): FreezeState {
  if (!canEarnFromAd(f, today)) return f;
  return { ...f, count: f.count + 1, lastAdEarnDay: today, log: withLog(f, today, 'ad') };
}

/**
 * A finished week where every active habit hit its goal: all scheduled days done for
 * daily/weekday habits, the weekly target for "X per week" habits. Needs at least one habit
 * that was active that week.
 */
export function isPerfectWeek(
  habits: FreezeHabit[],
  entries: Record<HabitId, Entries>,
  weekStart: DayKey,
  today: DayKey,
  weekStartsOn: 0 | 1,
): boolean {
  const weekEnd = addDays(weekStart, 6);
  if (weekEnd >= today) return false;
  let considered = 0;
  for (const habit of habits) {
    if (habit.archivedAt || habit.createdAt > weekEnd) continue;
    const habitEntries = entries[habit.id] ?? {};
    if (habit.schedule.kind === 'perWeek') {
      considered++;
      if (weekCount(habit, habitEntries, weekEnd, weekStartsOn) < habit.schedule.times) return false;
      continue;
    }
    for (let d = weekStart; d <= weekEnd; d = addDays(d, 1)) {
      if (d < habit.createdAt || !isScheduledOn(habit.schedule, d)) continue;
      considered++;
      if (dayStatus(habit, habitEntries, d) === 'none') return false;
    }
  }
  return considered > 0;
}

/** Perfect-week bonus: max one per week and the inventory cap still applies. */
export function earnPerfectWeek(f: FreezeState, weekStart: DayKey): FreezeState {
  if (f.count >= MAX_FREEZES || f.lastPerfectWeek === weekStart) return f;
  return { ...f, count: f.count + 1, lastPerfectWeek: weekStart, log: withLog(f, weekStart, 'perfectWeek') };
}

export interface FreezePlan {
  freezes: FreezeState;
  /** Frozen entries to write. */
  writes: { habitId: HabitId; day: DayKey; entry: Entry }[];
}

/**
 * Lazy day-close, run at app open and widget refresh. For each of the last two finished days
 * (never further back), if a daily/weekday habit with a streak of 2 or more missed a scheduled
 * day and a freeze is held, spend one freeze that protects all habits for that day. "X per week"
 * habits get the frozen day as one completion toward their week unless the week is already met.
 */
export function planFreezes(args: {
  habits: FreezeHabit[];
  entries: Record<HabitId, Entries>;
  freezes: FreezeState;
  today: DayKey;
  weekStartsOn: 0 | 1;
  now?: number;
}): FreezePlan {
  const { habits, today, weekStartsOn, now = Date.now() } = args;
  const active = habits.filter((h) => !h.archivedAt);
  const working: Record<HabitId, Entries> = {};
  for (const h of active) working[h.id] = { ...(args.entries[h.id] ?? {}) };
  let freezes = args.freezes;
  const writes: FreezePlan['writes'] = [];

  for (let back = MAX_RETRO_DAYS; back >= 1; back--) {
    if (freezes.count <= 0) break;
    const day = addDays(today, -back);
    const needsFreeze = active.some(
      (h) =>
        h.schedule.kind !== 'perWeek' &&
        day >= h.createdAt &&
        isScheduledOn(h.schedule, day) &&
        dayStatus(h, working[h.id], day) === 'none' &&
        streakBefore(h, working[h.id], day) >= 2,
    );
    if (!needsFreeze) continue;

    for (const h of active) {
      if (day < h.createdAt || dayStatus(h, working[h.id], day) !== 'none') continue;
      const missed =
        h.schedule.kind === 'perWeek'
          ? weekCount(h, working[h.id], addDays(startOfWeek(day, weekStartsOn), 6), weekStartsOn) < h.schedule.times
          : isScheduledOn(h.schedule, day);
      if (!missed) continue;
      const entry: Entry = { value: 0, frozen: true, updatedAt: now };
      working[h.id][day] = entry;
      writes.push({ habitId: h.id, day, entry });
    }
    freezes = { ...freezes, count: freezes.count - 1, log: withLog(freezes, day, 'used') };
  }
  return { freezes, writes };
}
