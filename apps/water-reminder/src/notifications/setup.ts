import * as Notifications from 'expo-notifications';
import { initNotifications } from '@shared/notify';
import { t } from '@shared/i18n';
import { formatAmount } from '@/domain/units';
import { preferredCup, useSettings } from '@/store/settings';

export const CHANNEL_NORMAL = 'reminders';
export const CHANNEL_GENTLE = 'reminders_gentle';
export const CATEGORY = 'WATER_REMINDER';
export const ACTION_ADD = 'ADD_CUP';
export const ACTION_SNOOZE = 'SNOOZE';

let channelsDone: Promise<void> | null = null;

/**
 * Android channels (plan §10.1): "Water reminders" (high, with the drop sound and a short
 * vibration) and "Gentle reminders" (low, silent). Needs to run before the first permission
 * request, because the shared helper only creates its default channel on the first call.
 */
export function setupChannels(): Promise<void> {
  channelsDone ??= initNotifications([
    {
      id: CHANNEL_NORMAL,
      name: t('notify.channelNormal'),
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'drop.wav',
      vibrationPattern: [0, 120, 80, 120],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    },
    { id: CHANNEL_GENTLE, name: t('notify.channelGentle'), importance: Notifications.AndroidImportance.LOW, sound: null },
  ]);
  return channelsDone;
}

let categorySignature = '';

/**
 * The "Add 250 ml" and "Snooze 15 min" buttons. The label has to follow the preferred cup, the
 * unit and the snooze time, so this is re-run whenever one of them changes.
 */
export async function registerCategory(): Promise<void> {
  const { cups, prefs, goal, reminders } = useSettings.getState();
  const cup = preferredCup({ cups, prefs });
  const add = t('notify.addCup', { amount: `${formatAmount(cup.ml, goal.unit)} ${t(`units.${goal.unit}`)}` });
  const snooze = t('notify.snooze', { minutes: reminders.snoozeMin });
  const signature = `${add}|${snooze}`;
  if (signature === categorySignature) return;
  categorySignature = signature;
  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: ACTION_ADD, buttonTitle: add, options: { opensAppToForeground: false } },
    { identifier: ACTION_SNOOZE, buttonTitle: snooze, options: { opensAppToForeground: false } },
  ]);
}

export async function setupNotifications(): Promise<void> {
  await setupChannels();
  await registerCategory();
}

/** Tests only. */
export const resetSetup = () => {
  channelsDone = null;
  categorySignature = '';
};
