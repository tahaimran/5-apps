import { cancel, getNotificationPermission, scheduleSeries, type SeriesEntry } from '@shared/notify';
import { t } from '@shared/i18n';
import { addDays, dayKeyFor } from '@/domain/dayKey';
import { planReminders, planSnooze, type PlannedReminder } from '@/domain/reminderPlan';
import type { ScheduledReminder } from '@/domain/types';
import { preferredCup, useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useWater } from '@/store/water';
import { CATEGORY, CHANNEL_GENTLE, CHANNEL_NORMAL, setupNotifications } from './setup';

export const SERIES_SLOTS = 'reminder';
export const SERIES_SNOOZE = 'snooze';
const HOUR = 3_600_000;

function contentFor(p: PlannedReminder): SeriesEntry['content'] {
  const base = { data: { path: '/', day: p.day, kind: p.kind } };
  if (p.kind === 'misses') return { ...base, title: t('notify.missesTitle'), body: t('notify.missesBody') };
  return { ...base, title: t('notify.title'), body: t(`notify.messages.${p.messageIndex}`), categoryIdentifier: CATEGORY };
}

let lastSignature = '';
let queue: Promise<unknown> = Promise.resolve();

async function run(): Promise<void> {
  await setupNotifications();
  const { reminders, goal, cups, prefs } = useSettings.getState();
  const water = useWater.getState();
  // Not useToday: in a background task the process can outlive the day it was started on.
  const now = new Date();
  const today = dayKeyFor(now, reminders.wakeMin);
  const permission = await getNotificationPermission();

  const todayLogs = water.logsForDay(today);
  const yesterdayLogs = water.logsForDay(addDays(today, -1));
  const plan = permission.granted
    ? planReminders({
        now,
        reminders,
        goalMl: goal.goalMl,
        cupMl: preferredCup({ cups, prefs }).ml,
        logTimes: [...yesterdayLogs, ...todayLogs].filter((l) => l.ts > now.getTime() - 12 * HOUR).map((l) => l.ts),
        todayReached: water.summaries[today]?.reached ?? false,
      })
    : [];

  // Anything that changes the plan changes this string; a re-run with the same one is a no-op.
  const channel = reminders.style === 'gentle' ? CHANNEL_GENTLE : CHANNEL_NORMAL;
  const signature = JSON.stringify([channel, plan.map((p) => [p.at.getTime(), p.kind, p.messageIndex])]);
  if (signature !== lastSignature) {
    await scheduleSeries(SERIES_SLOTS, plan.map((p) => ({ at: p.at, content: contentFor(p) })), channel);
    lastSignature = signature;
  }
  if (!permission.granted || (water.summaries[today]?.reached ?? false)) await cancel(SERIES_SNOOZE);

  const slots: ScheduledReminder[] = plan.map((p, i) => ({ notificationId: `${SERIES_SLOTS}:${i}`, fireAt: p.at.getTime(), kind: 'slot' }));
  const snooze = (db.get('scheduled') ?? []).filter((s) => s.kind === 'snooze' && s.fireAt > now.getTime());
  db.set('scheduled', [...slots, ...snooze]);
}

/**
 * Re-plans every pending reminder from the current data (plan §10.2): rolling horizon of one-off
 * notifications for today and the next two days. Cheap to call often: runs are serialized and
 * skipped when the plan has not changed. Call after any log, settings change, foreground and
 * permission change.
 */
export function rescheduleReminders(): Promise<void> {
  queue = queue.then(run, run).catch(() => undefined);
  return queue as Promise<void>;
}

/** Forces the next run to reschedule (after the permission or the OS state changed under us). */
export const invalidateReminderPlan = () => {
  lastSignature = '';
};

/** Cancels the pending snooze (the user drank, or reached the goal). */
export async function cancelSnooze(): Promise<void> {
  await cancel(SERIES_SNOOZE);
  db.set('scheduled', (db.get('scheduled') ?? []).filter((s) => s.kind !== 'snooze'));
}

/**
 * "Snooze 15 min": one notification at now + snooze (replacing an earlier one); dropped if it
 * would fall after bedtime. Returns when it will fire, or null.
 */
export async function scheduleSnooze(now = new Date()): Promise<Date | null> {
  await setupNotifications();
  const { reminders } = useSettings.getState();
  const at = planSnooze(now, reminders);
  if (!at) {
    await cancelSnooze();
    return null;
  }
  const channel = reminders.style === 'gentle' ? CHANNEL_GENTLE : CHANNEL_NORMAL;
  await scheduleSeries(SERIES_SNOOZE, [{ at, content: { title: t('notify.title'), body: t('notify.snoozeBody'), data: { path: '/', kind: 'snooze' }, categoryIdentifier: CATEGORY } }], channel);
  const others = (db.get('scheduled') ?? []).filter((s) => s.kind !== 'snooze');
  db.set('scheduled', [...others, { notificationId: `${SERIES_SNOOZE}:0`, fireAt: at.getTime(), kind: 'snooze' }]);
  return at;
}
