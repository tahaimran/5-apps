import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { t } from '@shared/i18n';
import { cancel, ensureNotificationPermission, getNotificationPermission, initNotifications, scheduleSeries, type NotificationContent } from '@shared/notify';
import { sharedStore } from '@shared/storage';
import { dateKeyFor } from '@/domain/dateKey';
import { DEEP_LINK, planReminders, REMINDER_CHANNEL, REMINDER_ID, type PlannedReminder } from '@/domain/reminder';
import { effectiveStreak } from '@/domain/streak';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useDaily, useStreak } from '@/store/stores';
import { useToday } from '@/store/today';

/** Creates the Android channel `daily` (default importance, plan §11). Safe to call again. */
export const setupNotifications = () => initNotifications([{ id: REMINDER_CHANNEL, name: t('reminder.channel'), description: t('reminder.channelDescription') }]);

/** The message of one planned notification (plan §11 copy, rotated). Tapping opens `quizora://daily`. */
export function contentFor(p: PlannedReminder): NotificationContent {
  const body =
    p.kind === 'atRisk'
      ? t('reminder.atRisk', { count: p.streak })
      : p.kind === 'streak'
        ? t('reminder.streakCopy', { count: p.streak })
        : p.kind === 'comeback3'
          ? t('reminder.comeback3')
          : p.kind === 'comeback7'
            ? t('reminder.comeback7')
            : t(`reminder.copy.${p.variant}`);
  return { title: t('app.name'), body, data: { url: DEEP_LINK, dateKey: p.dateKey } };
}

/**
 * Plans the next days of notifications from the settings and today's progress, replacing any earlier
 * plan (idempotent). Nothing is scheduled when reminders are off or the permission is missing. Called on
 * launch, on foreground, when the time changes and after each Daily, and it reads the stores and the clock
 * itself, so it never trusts an "today" captured earlier (a background call may run days later).
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
  const plan = planReminders({
    now,
    today,
    hour: reminder.hour,
    minute: reminder.minute,
    doneToday: useDaily.getState().value.lastPlayedDate === today,
    streak: effectiveStreak(useStreak.getState().value, today),
  });
  return scheduleSeries(REMINDER_ID, plan.map((p) => ({ at: p.at, content: contentFor(p) })), REMINDER_CHANNEL);
}

export type EnableResult = 'enabled' | 'denied' | 'blocked';

/** Turns reminders on at a time: asks the system for permission (the caller already explained why), then plans. */
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

/** Keeps the scheduled notifications right: on mount, when the day or the progress changes, and on foreground. Mount once. */
export function useReminderSync() {
  const reminder = useSettings((s) => s.settings.reminder);
  const today = useToday((s) => s.today);
  const played = useDaily((s) => s.value.lastPlayedDate);
  const streak = useStreak((s) => s.value);
  useEffect(() => {
    void syncReminder().catch(() => undefined);
  }, [reminder, today, played, streak]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncReminder().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);
}

/** Where a notification tap goes. The date is NOT taken from the notification: Daily entry reads the clock. */
export function openDailyFromNotification(onExternalOpen?: () => void): boolean {
  const done = sharedStore.get('onboarding.completedAt') !== undefined && db.get('onboarding.done') === true;
  onExternalOpen?.();
  if (!done) return false;
  router.push('/daily');
  return true;
}

/** Opens the Daily Challenge when a reminder is tapped (`quizora://daily`), once per tap, also from a killed app. */
export function useNotificationResponses(onExternalOpen?: () => void) {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = response.notification.request.identifier;
    if (db.get('handledResponse') === id) return;
    db.set('handledResponse', id);
    openDailyFromNotification(onExternalOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one tap, one open
  }, [response]);
}
