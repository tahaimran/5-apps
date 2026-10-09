import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { clockJump, sampleClock, type ClockSample } from '@/domain/clock';

/**
 * Calls `onJump(driftMs)` when the phone's clock was moved while the app was in front (plan §5.1:
 * "uses monotonic delta when app alive"). The baseline is taken again whenever the app returns to the
 * foreground, because the monotonic clock stops while the phone sleeps.
 */
export function useClockWatch(enabled: boolean, onJump: (driftMs: number) => void, intervalMs = 1000) {
  const callback = useRef(onJump);
  callback.current = onJump;
  useEffect(() => {
    if (!enabled) return undefined;
    let last: ClockSample = sampleClock();
    const id = setInterval(() => {
      const next = sampleClock();
      const drift = clockJump(last, next);
      last = next;
      if (drift !== 0) callback.current(drift);
    }, intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') last = sampleClock();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [enabled, intervalMs]);
}
