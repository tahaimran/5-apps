import { cancel, getNotificationPermission, scheduleSeries } from '@shared/notify';
import { t } from '@shared/i18n';
import { IDLE_PROMPT_MS } from '@/domain/session';
import { openContraction } from '@/domain/stats';
import type { ContractionSession } from '@/domain/types';
import { useSessions } from '@/store/sessions';
import { CHANNEL, setupNotifications } from './index';

export const SESSION_OPEN_ID = 'session-open';

/** When the "still timing?" note is due: 2 hours after the last tap (or after "Keep"). Null while a contraction runs or with no session. */
export function sessionOpenDueAt(s: ContractionSession | null): number | null {
  if (!s || openContraction(s.contractions)) return null;
  return Math.max(s.lastActivityAt, s.snoozedAt ?? 0) + IDLE_PROMPT_MS;
}

/**
 * Plan §10 "Session left open": scheduled on each stop, cancelled on the next tap and when the session ends.
 * It only schedules when notification permission is already granted; the app never asks for it here
 * (the permission is requested only when the person turns on a reminder). The note carries no health data.
 */
export async function syncSessionOpenNotification(s: ContractionSession | null): Promise<void> {
  const due = sessionOpenDueAt(s);
  if (due === null) {
    await cancel(SESSION_OPEN_ID);
    return;
  }
  const permission = await getNotificationPermission();
  if (!permission.granted) return;
  await setupNotifications();
  await scheduleSeries(SESSION_OPEN_ID, [{ at: new Date(due), content: { title: t('app.name'), body: t('notifications.sessionOpen'), data: { url: 'contractiontimer://timer' } } }], CHANNEL.timing);
}

/** Keeps the note in step with the store. Call once; returns the unsubscribe function. */
export function installSessionNotifier(): () => void {
  void syncSessionOpenNotification(useSessions.getState().active).catch(() => undefined);
  return useSessions.subscribe((state, prev) => {
    if (state.active === prev.active) return;
    const changed = sessionOpenDueAt(state.active) !== sessionOpenDueAt(prev.active);
    if (changed) void syncSessionOpenNotification(state.active).catch(() => undefined);
  });
}
