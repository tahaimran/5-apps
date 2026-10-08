import * as Notifications from 'expo-notifications';
import { cancel, getNotificationPermission, initNotifications, scheduleSeries, type SeriesEntry } from '@shared/notify';
import { t } from '@shared/i18n';
import { habitSeriesId, planNotifications, type PlannedNotification } from '@/domain/notificationPlan';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';

const FIXED_SERIES = ['summary', 'nudge', 'reengage'];
export const CATEGORY_DONE = 'habit-done';

let setupDone: Promise<void> | null = null;

/** Android channels (reminders, summary, streak) and the "Done ✓" action category. */
export function setupNotifications(): Promise<void> {
  setupDone ??= (async () => {
    await initNotifications([
      { id: 'reminders', name: t('notify.channelReminders'), importance: Notifications.AndroidImportance.DEFAULT },
      { id: 'summary', name: t('notify.channelSummary'), importance: Notifications.AndroidImportance.LOW },
      { id: 'streak', name: t('notify.channelStreak'), importance: Notifications.AndroidImportance.HIGH },
    ]);
    await Notifications.setNotificationCategoryAsync(CATEGORY_DONE, [
      { identifier: 'done', buttonTitle: t('notify.done'), options: { opensAppToForeground: false } },
    ]);
  })();
  return setupDone;
}

function contentFor(n: PlannedNotification): SeriesEntry['content'] {
  const habit = n.habitId ? useHabits.getState().habits[n.habitId] : undefined;
  return {
    title: t(n.message.titleKey, n.message.params),
    body: t(n.message.bodyKey, n.message.params),
    data: { path: n.habitId ? `/habit/${n.habitId}` : '/', habitId: n.habitId, day: n.day },
    categoryIdentifier: habit?.type === 'boolean' ? CATEGORY_DONE : undefined,
  };
}

let lastSignature = '';
let queue: Promise<unknown> = Promise.resolve();

async function run(): Promise<void> {
  await setupNotifications();
  const { habits, entries } = useHabits.getState();
  const { dayEndsAtHour, weekStartsOn, dailySummary, eveningNudge } = useSettings.getState().settings;
  const permission = await getNotificationPermission();

  const plan = permission.granted
    ? planNotifications({
        habits: Object.values(habits),
        entries,
        now: new Date(),
        dayEndsAtHour,
        weekStartsOn,
        dailySummary,
        eveningNudge,
        lastOpenAt: db.get('lastOpenAt'),
      })
    : [];

  const signature = JSON.stringify(plan.map((n) => [n.seriesId, n.at.getTime(), n.message]));
  if (signature === lastSignature) return;

  const bySeries = new Map<string, PlannedNotification[]>();
  for (const id of [...Object.keys(habits).map(habitSeriesId), ...FIXED_SERIES]) bySeries.set(id, []);
  for (const n of plan) bySeries.get(n.seriesId)?.push(n);

  for (const [seriesId, items] of bySeries) {
    const channel = items[0]?.channel ?? 'reminders';
    await scheduleSeries(
      seriesId,
      items.map((n) => ({ at: n.at, content: contentFor(n) })),
      channel,
    );
  }

  // Habits that were deleted since the last run.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const stale = new Set(
    scheduled
      .map((s) => s.identifier.match(/^(habit-[^:]+):/)?.[1])
      .filter((id): id is string => !!id && !bySeries.has(id)),
  );
  for (const id of stale) await cancel(id);

  lastSignature = signature;
}

/**
 * Re-plans every local notification for the next 7 days from the current data. Cheap to call
 * often: runs are serialized and skipped when the plan has not changed.
 */
export function rescheduleNotifications(): Promise<void> {
  queue = queue.then(run, run).catch(() => undefined);
  return queue as Promise<void>;
}

/** Forces the next run to reschedule (after permission changes). */
export const invalidateNotificationPlan = () => {
  lastSignature = '';
};
