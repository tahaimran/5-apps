import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { cancel, ensureNotificationPermission, getNotificationPermission, initNotifications, scheduleSeries, type NotificationContent } from '@shared/notify';
import { t } from '@shared/i18n';
import { sharedStore } from '@shared/storage';
import { dateKeyFor } from '@/domain/dateKey';
import { getPack } from '@/domain/packs';
import { planReminders, REMINDER_CHANNEL, REMINDER_ID, type PlannedReminder } from '@/domain/reminder';
import { dailyIdToOpen } from '@/features/play/dailyOpen';
import { openPuzzle } from '@/features/play/navigation';
import { useAds } from '@/store/ads';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';

/** Creates the "Daily puzzle" channel: default importance, no sound override (plan §10). Safe to call again. */
export const setupNotifications = () =>
  initNotifications([{ id: REMINDER_CHANNEL, name: t('reminder.channel'), description: t('reminder.channelDescription') }]);

/** The message of one planned day: a rotating, guilt-free line, with that day's theme. */
export function contentFor(p: PlannedReminder): NotificationContent {
  return {
    title: t('app.name'),
    body: t(`reminder.copy.${p.variant}`, { theme: getPack(p.packId)?.name ?? '' }),
    data: { dateKey: p.dateKey },
  };
}

/**
 * Plans the next days of reminders from the settings and today's progress (one a day; today's is
 * skipped when today's daily is done). Returns how many are scheduled. Nothing is scheduled when
 * reminders are off or the permission is missing. Called on launch, on foreground, when the time
 * changes and after each daily puzzle, so it always reads the stores fresh.
 */
export async function syncReminder(now: Date = new Date()): Promise<number> {
  await setupNotifications();
  const { reminder } = useSettings.getState().settings;
  const permission = await getNotificationPermission();
  if (!reminder.enabled || !permission.granted) {
    await cancel(REMINDER_ID);
    return 0;
  }
  const today = dateKeyFor(now);
  const plan = planReminders({ now, today, hour: reminder.hour, minute: reminder.minute, doneToday: !!useDaily.getState().daily.completed[today] });
  return scheduleSeries(REMINDER_ID, plan.map((p) => ({ at: p.at, content: contentFor(p) })), REMINDER_CHANNEL);
}

export type EnableResult = 'enabled' | 'denied' | 'blocked';

/** Turns reminders on at a time: asks the system for permission (the caller has already explained why), then plans. */
export async function enableReminder(hour: number, minute: number): Promise<EnableResult> {
  await setupNotifications();
  const granted = await ensureNotificationPermission(null);
  if (!granted) {
    const p = await getNotificationPermission();
    return p.canAskAgain ? 'denied' : 'blocked';
  }
  useSettings.getState().update({ reminder: { enabled: true, hour, minute } });
  await syncReminder();
  return 'enabled';
}

export async function disableReminder(): Promise<void> {
  useSettings.getState().update({ reminder: { ...useSettings.getState().settings.reminder, enabled: false } });
  await cancel(REMINDER_ID);
}

export async function changeReminderTime(hour: number, minute: number): Promise<void> {
  useSettings.getState().update({ reminder: { ...useSettings.getState().settings.reminder, hour, minute } });
  await syncReminder();
}

/** Keeps the scheduled reminders right: on mount, when the day or the progress changes, and on foreground. Mount once. */
export function useReminderSync() {
  const reminder = useSettings((s) => s.settings.reminder);
  const today = useToday((s) => s.today);
  const doneToday = useDaily((s) => !!s.daily.completed[today]);
  useEffect(() => {
    void syncReminder().catch(() => undefined);
  }, [reminder, today, doneToday]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncReminder().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);
}

/** Opens the daily puzzle when a reminder is tapped (plan §10). Counts as an external open for the ad rules. */
export function useNotificationResponses() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = response.notification.request.identifier;
    if (db.get('handledResponse') === id) return;
    db.set('handledResponse', id);
    useAds.getState().markExternalOpen();
    const ready = sharedStore.get('onboarding.completedAt') !== undefined && db.get('onboarding.tutorialDone') === true;
    if (!ready) return;
    const dateKey = (response.notification.request.content.data as { dateKey?: string } | undefined)?.dateKey ?? dateKeyFor(new Date());
    router.replace('/(tabs)');
    openPuzzle(dailyIdToOpen(useGame.getState().current, dateKey, useSettings.getState().settings.difficulty));
  }, [response]);
}
