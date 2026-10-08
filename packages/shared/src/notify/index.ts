import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { t } from '../i18n';

export const DEFAULT_CHANNEL_ID = 'reminders';

export interface ChannelConfig {
  id: string;
  name: string;
  importance?: Notifications.AndroidImportance;
  description?: string;
  /** File name of a bundled sound (expo-notifications `sounds` plugin option), or `null` for silent. */
  sound?: string | null;
  vibrationPattern?: number[];
  lockscreenVisibility?: Notifications.AndroidNotificationVisibility;
}

export type NotificationContent = Notifications.NotificationContentInput;

export interface PermissionReason {
  title?: string;
  message: string;
  allow?: string;
  notNow?: string;
}

let initialized = false;

/**
 * Creates the Android channels (a default "reminders" channel plus any the app lists) and
 * sets the foreground handler. Safe to call repeatedly; the other functions call it as needed.
 */
export async function initNotifications(
  channels: ChannelConfig[] = [{ id: DEFAULT_CHANNEL_ID, name: 'Reminders' }],
): Promise<void> {
  if (initialized) return;
  initialized = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    for (const c of channels) {
      await Notifications.setNotificationChannelAsync(c.id, {
        name: c.name,
        description: c.description,
        importance: c.importance ?? Notifications.AndroidImportance.DEFAULT,
        ...(c.sound !== undefined && { sound: c.sound }),
        ...(c.vibrationPattern && { vibrationPattern: c.vibrationPattern }),
        ...(c.lockscreenVisibility !== undefined && { lockscreenVisibility: c.lockscreenVisibility }),
      });
    }
  }
}

const confirm = (reason: PermissionReason) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      reason.title ?? t('shared.notify.title'),
      reason.message,
      [
        { text: reason.notNow ?? t('shared.notify.notNow'), style: 'cancel', onPress: () => resolve(false) },
        { text: reason.allow ?? t('shared.notify.allow'), onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

export interface PermissionState {
  granted: boolean;
  /** False once the user has refused for good; only system settings can change it then. */
  canAskAgain: boolean;
}

export async function getNotificationPermission(): Promise<PermissionState> {
  const p = await Notifications.getPermissionsAsync();
  return { granted: p.granted, canAskAgain: p.canAskAgain };
}

/**
 * Explains why notifications are needed (`reasonCopy`, or nothing for `null`) and only then
 * triggers the system permission prompt. Returns whether notifications are allowed.
 */
export async function ensureNotificationPermission(reasonCopy: string | PermissionReason | null): Promise<boolean> {
  await initNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  // `null`: the caller already showed its own explanation (e.g. an onboarding step).
  if (reasonCopy !== null) {
    const reason = typeof reasonCopy === 'string' ? { message: reasonCopy } : reasonCopy;
    if (!(await confirm(reason))) return false;
  }
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Repeating daily reminder. Re-scheduling the same `id` replaces the previous one. */
export async function scheduleDaily(
  id: string,
  hour: number,
  minute: number,
  content: NotificationContent,
  channelId: string = DEFAULT_CHANNEL_ID,
): Promise<void> {
  await initNotifications();
  await cancel(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId },
  });
}

export interface SeriesEntry {
  at: Date;
  content: NotificationContent;
}

/**
 * One-off notifications at specific times (e.g. hydration reminders through the day, or
 * week-by-week milestones). Replaces any earlier series with the same `id`; past times are skipped.
 */
export async function scheduleSeries(
  id: string,
  entries: SeriesEntry[],
  channelId: string = DEFAULT_CHANNEL_ID,
): Promise<number> {
  await initNotifications();
  await cancel(id);
  const now = Date.now();
  let count = 0;
  for (const [i, entry] of entries.entries()) {
    if (entry.at.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${id}:${i}`,
      content: entry.content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: entry.at, channelId },
    });
    count++;
  }
  return count;
}

/** Cancels a daily reminder, or a whole series, scheduled under `id`. */
export async function cancel(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(`${id}:`))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}
