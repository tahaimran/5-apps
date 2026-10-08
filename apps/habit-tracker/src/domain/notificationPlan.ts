import { dayProgress } from './percent';
import { addDays, dayKeyFor, parseDayKey, startOfWeek } from './dayKey';
import { isComplete } from './completion';
import { isActiveOn, isScheduledOn } from './schedule';
import { computeStreaks, weekCount, type Entries } from './streaks';
import type { DayKey, Habit, HabitId } from './types';

export type NotificationKind = 'habit' | 'summary' | 'nudge' | 'reengage';
export type NotificationChannel = 'reminders' | 'summary' | 'streak';

export interface PlannedMessage {
  titleKey: string;
  bodyKey: string;
  params: Record<string, string | number>;
}

export interface PlannedNotification {
  /** One series per habit (`habit-<id>`), plus `summary`, `nudge` and `reengage`. */
  seriesId: string;
  at: Date;
  kind: NotificationKind;
  channel: NotificationChannel;
  habitId?: HabitId;
  /** The tracking day this notification is about. */
  day: DayKey;
  message: PlannedMessage;
}

export interface PlanInput {
  habits: Habit[];
  entries: Record<HabitId, Entries>;
  now: Date;
  dayEndsAtHour: number;
  weekStartsOn: 0 | 1;
  dailySummary: { enabled: boolean; time: string };
  eveningNudge: { enabled: boolean; time: string };
  /** When the app was last opened (ms). */
  lastOpenAt?: number;
  /** Android caps scheduled alarms, so we stay well under it. */
  budget?: number;
  windowDays?: number;
}

export const DEFAULT_BUDGET = 64;
export const WINDOW_DAYS = 7;
const NUDGE_QUIET_MS = 30 * 60_000;
const REENGAGE_AFTER_MS = 48 * 3_600_000;

function atTime(calendarDay: DayKey, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = parseDayKey(calendarDay);
  d.setHours(h, m, 0, 0);
  return d;
}

export const habitSeriesId = (id: HabitId) => `habit-${id}`;

/**
 * Plans the next 7 days of local notifications:
 * per-habit reminders (skipped when already done, or once a per-week target is met), an optional
 * daily summary, an evening streak nudge for today only if a streak of 2+ is at risk, and one
 * "we saved your spot" nudge 48 hours after the last open. The result is capped to `budget`,
 * keeping the nudge and re-engagement first. Re-run after any check-in or app open.
 */
export function planNotifications(input: PlanInput): PlannedNotification[] {
  const { now, dayEndsAtHour, weekStartsOn } = input;
  const budget = input.budget ?? DEFAULT_BUDGET;
  const windowDays = input.windowDays ?? WINDOW_DAYS;
  const today = dayKeyFor(now, dayEndsAtHour);
  const calendarToday = dayKeyFor(now, 0);
  const active = input.habits.filter((h) => !h.archivedAt);
  const planned: PlannedNotification[] = [];

  for (let i = 0; i < windowDays; i++) {
    const calendarDay = addDays(calendarToday, i);

    // Per-habit reminders.
    for (const habit of active) {
      const time = habit.reminders[0]?.time;
      if (!time) continue;
      const at = atTime(calendarDay, time);
      if (at.getTime() <= now.getTime()) continue;
      const day = dayKeyFor(at, dayEndsAtHour);
      if (!isActiveOn(habit, day) || !isScheduledOn(habit.schedule, day)) continue;
      const e = input.entries[habit.id] ?? {};

      if (habit.schedule.kind === 'perWeek' && startOfWeek(day, weekStartsOn) === startOfWeek(today, weekStartsOn)) {
        if (weekCount(habit, e, day < today ? day : today, weekStartsOn) >= habit.schedule.times) continue;
      }
      if (day === today && isComplete(habit, e[day])) continue;

      const value = day === today ? (e[day]?.value ?? 0) : 0;
      const showProgress = habit.type === 'count' && value > 0;
      planned.push({
        seriesId: habitSeriesId(habit.id),
        at,
        kind: 'habit',
        channel: 'reminders',
        habitId: habit.id,
        day,
        message: {
          titleKey: 'notify.habitTitle',
          bodyKey: showProgress ? 'notify.habitProgress' : 'notify.habitBody',
          params: { name: habit.name, value, target: habit.target, unit: habit.unit ?? '' },
        },
      });
    }

    // Daily summary.
    if (input.dailySummary.enabled) {
      const at = atTime(calendarDay, input.dailySummary.time);
      if (at.getTime() > now.getTime()) {
        const day = dayKeyFor(at, dayEndsAtHour);
        let left: number;
        if (day === today) {
          const p = dayProgress(active, input.entries, today, weekStartsOn);
          left = p.total - p.done;
        } else {
          left = active.filter((h) => isActiveOn(h, day) && isScheduledOn(h.schedule, day)).length;
        }
        if (left > 0) {
          planned.push({
            seriesId: 'summary',
            at,
            kind: 'summary',
            channel: 'summary',
            day,
            message: { titleKey: 'notify.summaryTitle', bodyKey: 'notify.summaryBody', params: { count: left } },
          });
        }
      }
    }
  }

  // Evening streak nudge: today only, computed now.
  if (input.eveningNudge.enabled) {
    const at = atTime(calendarToday, input.eveningNudge.time);
    const day = dayKeyFor(at, dayEndsAtHour);
    const appOpenedRecently = input.lastOpenAt !== undefined && at.getTime() - input.lastOpenAt < NUDGE_QUIET_MS;
    if (day === today && at.getTime() > now.getTime() && !appOpenedRecently) {
      let atRisk = 0;
      for (const habit of active) {
        if (habit.schedule.kind === 'perWeek' || !isActiveOn(habit, today) || !isScheduledOn(habit.schedule, today)) continue;
        const e = input.entries[habit.id] ?? {};
        if (isComplete(habit, e[today])) continue;
        atRisk = Math.max(atRisk, computeStreaks(habit, e, today, weekStartsOn).current);
      }
      if (atRisk >= 2) {
        planned.push({
          seriesId: 'nudge',
          at,
          kind: 'nudge',
          channel: 'streak',
          day,
          message: { titleKey: 'notify.nudgeTitle', bodyKey: 'notify.nudgeBody', params: { count: atRisk } },
        });
      }
    }
  }

  // Re-engagement: one nudge two days after the last open.
  if (active.length > 0) {
    const at = new Date((input.lastOpenAt ?? now.getTime()) + REENGAGE_AFTER_MS);
    if (at.getTime() > now.getTime()) {
      planned.push({
        seriesId: 'reengage',
        at,
        kind: 'reengage',
        channel: 'reminders',
        day: dayKeyFor(at, dayEndsAtHour),
        message: { titleKey: 'notify.reengageTitle', bodyKey: 'notify.reengageBody', params: {} },
      });
    }
  }

  const byTime = (a: PlannedNotification, b: PlannedNotification) => a.at.getTime() - b.at.getTime();
  const keep = planned.filter((p) => p.kind === 'nudge' || p.kind === 'reengage');
  const rest = planned.filter((p) => p.kind !== 'nudge' && p.kind !== 'reengage').sort(byTime);
  return [...keep, ...rest.slice(0, Math.max(0, budget - keep.length))].sort(byTime);
}
