import * as Notifications from 'expo-notifications';
import { db } from '@/store/storage';
import { preferredCup, useSettings } from '@/store/settings';
import { useWater } from '@/store/water';
import { cancelSnooze, rescheduleReminders, scheduleSnooze } from './scheduler';
import { ACTION_ADD, ACTION_SNOOZE } from './setup';

/**
 * The same action can reach us twice: from the background task (app closed) and, on the next
 * launch, as the "last notification response". The handled key lives in MMKV, which both JS
 * contexts share, so the drink is logged once.
 */
export function claimResponse(response: Pick<Notifications.NotificationResponse, 'notification' | 'actionIdentifier'>): boolean {
  const key = `${response.notification.request.identifier}:${response.actionIdentifier}:${response.notification.date}`;
  if (db.get('handledResponse') === key) return false;
  db.set('handledResponse', key);
  return true;
}

/** "Add 250 ml" on a reminder: logs the preferred cup, clears the notification and re-plans. Returns whether a drink was logged. */
export async function addCupFromNotification(notificationId?: string): Promise<boolean> {
  const { cups, prefs } = useSettings.getState();
  useWater.getState().logDrink({ volumeMl: preferredCup({ cups, prefs }).ml, source: 'notification' });
  if (notificationId) await Notifications.dismissNotificationAsync(notificationId).catch(() => undefined);
  await cancelSnooze();
  await rescheduleReminders();
  return true;
}

/** "Snooze 15 min": clears the notification and sets the one-off reminder. */
export async function snoozeFromNotification(notificationId?: string): Promise<boolean> {
  if (notificationId) await Notifications.dismissNotificationAsync(notificationId).catch(() => undefined);
  return (await scheduleSnooze()) !== null;
}

/** Runs a notification action once; returns whether it was one of ours and had an effect. */
export async function handleNotificationAction(response: Notifications.NotificationResponse): Promise<boolean> {
  if (response.actionIdentifier !== ACTION_ADD && response.actionIdentifier !== ACTION_SNOOZE) return false;
  if (!claimResponse(response)) return false;
  const id = response.notification.request.identifier;
  return response.actionIdentifier === ACTION_ADD ? addCupFromNotification(id) : snoozeFromNotification(id);
}
