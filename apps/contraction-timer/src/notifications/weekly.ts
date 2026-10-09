import { useEffect } from 'react';
import { AppState } from 'react-native';
import { cancel, ensureNotificationPermission, getNotificationPermission, scheduleSeries } from '@shared/notify';
import { t } from '@shared/i18n';
import { profileEdd } from '@/domain/dueDate';
import { upcomingWeeklyCards } from '@/domain/weekly';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { CHANNEL, setupNotifications } from './index';

export const WEEKLY_ID = 'weekly-card';

/**
 * Plan §10: "Week 35: baby is about the size of a honeydew melon 🍈", once a week at 10:00 local, from the due date.
 * On unless switched off in More; it is only scheduled when the notification permission already exists (it is
 * asked for when a reminder is turned on, never here on its own). Returns how many were scheduled.
 */
export async function syncWeeklyCards(now: Date = new Date()): Promise<number> {
  await setupNotifications();
  const edd = profileEdd(useProfile.getState().profile);
  if (!useSettings.getState().settings.weeklyCardNotif || !edd) {
    await cancel(WEEKLY_ID);
    return 0;
  }
  const permission = await getNotificationPermission();
  if (!permission.granted) {
    await cancel(WEEKLY_ID);
    return 0;
  }
  const cards = upcomingWeeklyCards(edd, now);
  return scheduleSeries(
    WEEKLY_ID,
    cards.map((c) => ({ at: c.at, content: { title: t('app.name'), body: t('weekly.body', { n: c.week, size: c.size, emoji: c.emoji }).trim(), data: { url: 'contractiontimer://timer' } } })),
    CHANNEL.weekly,
  );
}

/** The More switch: turning it on asks for the phone's permission (this is "turning on a reminder"); turning it off needs none. */
export async function setWeeklyCards(on: boolean): Promise<boolean> {
  if (on && !(await ensureNotificationPermission(null))) {
    useSettings.getState().update({ weeklyCardNotif: false });
    await syncWeeklyCards();
    return false;
  }
  useSettings.getState().update({ weeklyCardNotif: on });
  await syncWeeklyCards();
  return on;
}

/** Keeps the weekly cards right at launch, when the due date or the switch changes, and on foreground. Mount once. */
export function useWeeklyCardSync() {
  const enabled = useSettings((s) => s.settings.weeklyCardNotif);
  const profile = useProfile((s) => s.profile);
  useEffect(() => {
    void syncWeeklyCards().catch(() => undefined);
  }, [enabled, profile]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncWeeklyCards().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);
}
