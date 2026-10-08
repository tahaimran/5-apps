import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';
import { refreshWidget } from '@/widget/sync';
import { completeFromNotification, DONE_ACTION } from './actions';
import { registerNotificationTask } from './backgroundTask';
import { rescheduleNotifications, setupNotifications } from './scheduler';

const touchOpen = () => db.set('lastOpenAt', Date.now());

/**
 * Mount once at app start: sets up channels, records opens, and re-plans notifications after
 * any change (debounced) and whenever the app returns to the foreground.
 */
export function useNotificationSync() {
  useEffect(() => {
    touchOpen();
    setupNotifications().then(registerNotificationTask).catch(() => undefined);
    void rescheduleNotifications();

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void rescheduleNotifications(), 500);
    };
    const unsubscribe = [useHabits.subscribe(schedule), useSettings.subscribe(schedule), useToday.subscribe(schedule)];
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        touchOpen();
        schedule();
      }
    });
    return () => {
      unsubscribe.forEach((u) => u());
      app.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);
}

/** Taps on a notification (also from a cold start) open the habit; "Done ✓" checks it off. */
export function useNotificationResponses() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response) return;
    const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
    if (handled.has(key)) return;
    handled.add(key);
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    if (response.actionIdentifier === DONE_ACTION) {
      if (completeFromNotification(data)) void refreshWidget();
    } else if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const path = typeof data?.path === 'string' ? data.path : '/';
      router.push(path as Href);
    }
  }, [response]);
}

const handled = new Set<string>();
