import * as Notifications from 'expo-notifications';
import { initNotifications } from '@shared/notify';
import { t } from '@shared/i18n';

/** Android channel ids of plan §10. */
export const CHANNEL = { kick: 'kick-reminder', weekly: 'weekly', timing: 'timing' } as const;

/**
 * Creates the Android channels: the kick reminder at default importance, the weekly size card and the
 * "session left open" note at low importance with no sound. Safe to call again.
 */
export const setupNotifications = () =>
  initNotifications([
    { id: CHANNEL.kick, name: t('notifications.channel.kick'), description: t('notifications.channel.kickDescription'), importance: Notifications.AndroidImportance.DEFAULT },
    { id: CHANNEL.weekly, name: t('notifications.channel.weekly'), description: t('notifications.channel.weeklyDescription'), importance: Notifications.AndroidImportance.LOW, sound: null },
    { id: CHANNEL.timing, name: t('notifications.channel.timing'), description: t('notifications.channel.timingDescription'), importance: Notifications.AndroidImportance.LOW, sound: null },
  ]);
