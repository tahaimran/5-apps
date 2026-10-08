import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { handleNotificationAction } from './actions';
import { rescheduleReminders } from './scheduler';

export const ACTION_TASK = 'SIPLING_NOTIFICATION_ACTION';
export const TOPUP_TASK = 'SIPLING_REMINDER_TOPUP';
/** Plan §10.2: top up the rolling horizon about every 12 hours, best effort. */
export const TOPUP_INTERVAL_MIN = 12 * 60;

/**
 * Handles "Add 250 ml" and "Snooze" taps while the app is in the background or closed (Android
 * runs this task for notification actions). Defined at module scope and imported from index.ts.
 */
TaskManager.defineTask<Notifications.NotificationTaskPayload>(ACTION_TASK, async ({ data }) => {
  if ('actionIdentifier' in data) await handleNotificationAction(data);
  return Notifications.BackgroundNotificationTaskResult.NoData;
});

/** Keeps three days of reminders scheduled even if the app is not opened (best effort, OS decides when). */
TaskManager.defineTask(TOPUP_TASK, async () => {
  try {
    await rescheduleReminders();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export function registerBackgroundWork(): void {
  Notifications.registerTaskAsync(ACTION_TASK).catch(() => undefined);
  BackgroundTask.registerTaskAsync(TOPUP_TASK, { minimumInterval: TOPUP_INTERVAL_MIN }).catch(() => undefined);
}
