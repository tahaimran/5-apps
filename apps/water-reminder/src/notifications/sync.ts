import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { markExternalOpen } from '@/ads/guard';
import { shouldOfferGuide, suspectedMisses } from '@/domain/misses';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { handleNotificationAction } from './actions';
import { registerBackgroundWork } from './backgroundTask';
import { cancelSnooze, invalidateReminderPlan, rescheduleReminders } from './scheduler';
import { setupNotifications } from './setup';

const touchOpen = () => db.set('lastOpenAt', Date.now());

/** Counts reminders the OS dropped, to offer the battery guide after two (plan §10.5). */
export async function detectMissedReminders(now = Date.now()): Promise<void> {
  const pending = new Set((await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier));
  const missed = suspectedMisses(db.get('scheduled') ?? [], pending, now);
  if (missed.length === 0) return;
  const { meta, update } = useMeta.getState();
  update({ suspectedMisses: (meta.suspectedMisses ?? 0) + missed.length });
}

export const batteryGuideDue = (): boolean => {
  const { meta } = useMeta.getState();
  return shouldOfferGuide(meta.suspectedMisses ?? 0, meta.batteryGuideOffered === true);
};

/**
 * Mount once at app start: sets up channels and the action buttons, registers the background
 * work, and re-plans reminders after any log or setting changes (debounced 500 ms) and whenever
 * the app returns to the foreground.
 */
export function useReminderSync() {
  useEffect(() => {
    touchOpen();
    setupNotifications().then(registerBackgroundWork).catch(() => undefined);
    void detectMissedReminders().finally(() => rescheduleReminders());

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void rescheduleReminders(), 500);
    };
    // Logging a drink also ends a pending snooze.
    let previous = useWater.getState().summaries;
    const unsubscribe = [
      useWater.subscribe((state) => {
        if (state.summaries !== previous) void cancelSnooze();
        previous = state.summaries;
        schedule();
      }),
      useSettings.subscribe(schedule),
      useToday.subscribe(schedule),
    ];
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        touchOpen();
        invalidateReminderPlan(); // the OS may have dropped alarms while we were away
        void detectMissedReminders().finally(schedule);
      }
    });
    return () => {
      unsubscribe.forEach((u) => u());
      app.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);
}

/** Taps on a reminder open Today; the action buttons log or snooze (also when they arrive after a cold start). */
export function useNotificationResponses() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response) return;
    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      markExternalOpen();
      router.navigate('/(tabs)');
      return;
    }
    void handleNotificationAction(response);
  }, [response]);
}
