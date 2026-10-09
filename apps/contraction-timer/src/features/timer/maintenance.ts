import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';

/**
 * Plan §5.6: on a cold start and whenever the app returns to the foreground, read the open session back
 * from disk, apply the idle rules once (asks after 2 hours, ends after 6) and check the pattern once.
 * No background timers: nothing runs while the app is away.
 */
export function runSessionMaintenance(now: number = Date.now()) {
  const sessions = useSessions.getState();
  if (sessions.checkIdle(now) === 'ended') return;
  if (useSettings.getState().settings.patternAlerts) sessions.evaluate(now);
}

export function useSessionMaintenance() {
  useEffect(() => {
    runSessionMaintenance();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runSessionMaintenance();
    });
    return () => sub.remove();
  }, []);
}
