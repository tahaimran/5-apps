import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { refreshWidget } from '@/widget/sync';
import { completeFromNotification, DONE_ACTION } from './actions';
import { rescheduleNotifications } from './scheduler';

const TASK = 'HABIT_NOTIFICATION_ACTION';

/**
 * Handles "Done ✓" taps while the app is in the background or closed (Android runs this task
 * for notification actions). Defined at module scope and imported from index.ts.
 */
TaskManager.defineTask<Notifications.NotificationTaskPayload>(TASK, async ({ data }) => {
  if ('actionIdentifier' in data && data.actionIdentifier === DONE_ACTION) {
    const changed = completeFromNotification(data.notification.request.content.data);
    if (changed) {
      await refreshWidget();
      await rescheduleNotifications();
    }
  }
  return Notifications.BackgroundNotificationTaskResult.NoData;
});

export function registerNotificationTask(): void {
  Notifications.registerTaskAsync(TASK).catch(() => undefined);
}
