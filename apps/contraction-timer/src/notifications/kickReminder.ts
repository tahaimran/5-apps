import { useEffect } from 'react';
import { AppState } from 'react-native';
import { cancel, ensureNotificationPermission, getNotificationPermission, scheduleDaily } from '@shared/notify';
import { t } from '@shared/i18n';
import { dateKeyFor, dayDiff } from '@/domain/dateKey';
import { profileEdd } from '@/domain/dueDate';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { CHANNEL, setupNotifications } from './index';

export const KICK_REMINDER_ID = 'kick-reminder';
/** Plan §10: reminders stop 21 days after the due date. */
export const REMINDER_STOP_DAYS = 21;

/** True once today is more than 21 days past the due date. `now` is read by the caller at that moment. */
export function reminderExpired(edd: string | null, now: Date): boolean {
  return edd !== null && dayDiff(edd, dateKeyFor(now)) > REMINDER_STOP_DAYS;
}

/**
 * Makes the scheduled reminder match the settings: one daily notification at the chosen time while it is on,
 * the permission is there and the due date is not more than 21 days gone. Called on launch, on foreground and
 * whenever the setting changes; it reads the stores and the clock fresh each time.
 */
export async function syncKickReminder(now: Date = new Date()): Promise<boolean> {
  await setupNotifications();
  const { kickReminder } = useSettings.getState().settings;
  if (!kickReminder.enabled) {
    await cancel(KICK_REMINDER_ID);
    return false;
  }
  if (reminderExpired(profileEdd(useProfile.getState().profile), now)) {
    await cancel(KICK_REMINDER_ID);
    useSettings.getState().update({ kickReminder: { ...kickReminder, enabled: false } });
    return false;
  }
  const permission = await getNotificationPermission();
  if (!permission.granted) {
    await cancel(KICK_REMINDER_ID);
    return false;
  }
  await scheduleDaily(KICK_REMINDER_ID, kickReminder.hour, kickReminder.minute, { title: t('app.name'), body: t('reminder.notificationBody'), data: { url: 'contractiontimer://kicks' } }, CHANNEL.kick);
  return true;
}

export type EnableResult = 'enabled' | 'denied' | 'blocked';

/**
 * Turns the reminder on. This is the only place the notification permission is asked for (plan §10: only when
 * the person turns a reminder on); the caller has already explained why. Android 13+ shows its own prompt.
 */
export async function enableKickReminder(hour: number, minute: number): Promise<EnableResult> {
  await setupNotifications();
  const granted = await ensureNotificationPermission(null);
  if (!granted) {
    const p = await getNotificationPermission();
    return p.canAskAgain ? 'denied' : 'blocked';
  }
  useSettings.getState().update({ kickReminder: { enabled: true, hour, minute } });
  await syncKickReminder();
  return 'enabled';
}

export async function disableKickReminder(): Promise<void> {
  useSettings.getState().update({ kickReminder: { ...useSettings.getState().settings.kickReminder, enabled: false } });
  await cancel(KICK_REMINDER_ID);
}

export async function changeKickReminderTime(hour: number, minute: number): Promise<void> {
  useSettings.getState().update({ kickReminder: { ...useSettings.getState().settings.kickReminder, hour, minute } });
  await syncKickReminder();
}

/** Keeps the schedule right at launch, when the setting changes, and when the app comes back to the foreground. Mount once. */
export function useKickReminderSync() {
  const reminder = useSettings((s) => s.settings.kickReminder);
  useEffect(() => {
    void syncKickReminder().catch(() => undefined);
  }, [reminder]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncKickReminder().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);
}
