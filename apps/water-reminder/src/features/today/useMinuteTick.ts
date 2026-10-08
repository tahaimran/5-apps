import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** A number that changes every minute and when the app returns to the foreground, to refresh "next reminder" style text. */
export function useMinuteTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && setTick((n) => n + 1));
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  return tick;
}
