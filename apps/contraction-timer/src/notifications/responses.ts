import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { db } from '@/store/storage';

/** Where a notification may send the app (an allowlist: a notification can never open anything else). */
const ROUTES: Record<string, '/timer' | '/kicks'> = { timer: '/timer', kicks: '/kicks' };

/** `contractiontimer://kicks` → `/kicks`; anything unknown → null. */
export function routeFor(url: unknown): '/timer' | '/kicks' | null {
  if (typeof url !== 'string') return null;
  const match = /^contractiontimer:\/\/([a-z]+)\/?$/.exec(url);
  return match ? (ROUTES[match[1]] ?? null) : null;
}

/** A listener for taps that opened the app (the ad rules treat them as "opened from a notification"). */
const listeners = new Set<() => void>();
export const onNotificationOpen = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

/** Opens the Timer or Kicks tab when a reminder or the "still timing?" note is tapped; each tap is handled once. */
export function useNotificationResponses() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = response.notification.request.identifier;
    if (db.get('handledResponse') === id) return;
    db.set('handledResponse', id);
    listeners.forEach((fn) => fn());
    const route = routeFor((response.notification.request.content.data as { url?: unknown } | undefined)?.url);
    if (route) router.navigate(route);
  }, [response]);
}
