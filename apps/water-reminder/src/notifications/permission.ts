import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { ensureNotificationPermission, getNotificationPermission, type PermissionState } from '@shared/notify';
import { t } from '@shared/i18n';
import { markInterruption } from '@/ads/guard';

/** The system notification permission, refreshed whenever the app comes back to the foreground (plan §10.3). */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const refresh = useCallback(() => {
    getNotificationPermission().then(setPermission).catch(() => undefined);
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);
  return { permission, refresh };
}

/**
 * "Turn on" from the Today card or Settings: explains, then asks. If the user has refused for
 * good, only the system settings can change it, so open them. Returns whether reminders are allowed.
 */
export async function requestReminderPermission(): Promise<boolean> {
  const current = await getNotificationPermission();
  if (current.granted) return true;
  if (!current.canAskAgain) {
    await Linking.openSettings();
    return false;
  }
  const granted = await ensureNotificationPermission({ title: t('notify.reasonTitle'), message: t('notify.reason') });
  markInterruption(); // the system dialog just closed: no app-open ad right now
  return granted;
}
