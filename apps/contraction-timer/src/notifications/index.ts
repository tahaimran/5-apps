import * as Notifications from 'expo-notifications';
import { initNotifications } from '@shared/notify';
import { t } from '@shared/i18n';

/**
 * Android channel ids of plan §10. Android fixes a channel's sound when the channel is created, so the
 * kick reminder moved to a new id when it gained the chime; the first version's `kick-reminder` channel
 * is deleted (LEGACY_CHANNELS).
 */
export const CHANNEL = { kick: 'kick-chime', weekly: 'weekly', timing: 'timing' } as const;
export const LEGACY_CHANNELS = ['kick-reminder'] as const;
/** The shared chime, bundled into res/raw by the expo-notifications plugin (app.config.ts). */
export const KICK_SOUND = 'reminder.wav';
/** Two short, soft pulses: noticeable in a pocket, never alarming. */
export const GENTLE_VIBRATION = [0, 180, 140, 180];

let channelsDone: Promise<void> | null = null;

/**
 * Creates the Android channels: the kick reminder at default importance with the chime and a gentle
 * vibration; the weekly size card and the "session left open" note at low importance with no sound
 * (the timing channel stays silent for a future ongoing notification too). Safe to call again; a
 * failure is retried on the next call.
 */
export function setupNotifications(): Promise<void> {
  channelsDone ??= initNotifications([
    {
      id: CHANNEL.kick,
      name: t('notifications.channel.kick'),
      description: t('notifications.channel.kickDescription'),
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: KICK_SOUND,
      vibrationPattern: GENTLE_VIBRATION,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    },
    { id: CHANNEL.weekly, name: t('notifications.channel.weekly'), description: t('notifications.channel.weeklyDescription'), importance: Notifications.AndroidImportance.LOW, sound: null },
    { id: CHANNEL.timing, name: t('notifications.channel.timing'), description: t('notifications.channel.timingDescription'), importance: Notifications.AndroidImportance.LOW, sound: null },
  ])
    .then(() => Promise.all(LEGACY_CHANNELS.map((id) => Notifications.deleteNotificationChannelAsync(id).catch(() => undefined))))
    .then(() => undefined)
    .catch((e: unknown) => {
      channelsDone = null;
      throw e;
    });
  return channelsDone;
}

/** Tests only. */
export const resetNotificationSetup = () => {
  channelsDone = null;
};
