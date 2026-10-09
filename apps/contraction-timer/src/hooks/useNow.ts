import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** True while the screen is in front of the others (it stops being true when another tab or screen covers it). */
export function useFocused(): boolean {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}

/** True while the app is in the foreground. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

/**
 * The current time, refreshed every `intervalMs` while `enabled`, the screen is focused and the app is in
 * the foreground (plan §5.6: no background JS timers). It is only for drawing: anything that decides or
 * saves reads `Date.now()` itself at that moment. Coming back to the foreground refreshes at once.
 */
export function useNow(enabled: boolean, intervalMs = 250): number {
  const focused = useFocused();
  const appActive = useAppActive();
  const running = enabled && focused && appActive;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [running, intervalMs]);
  return running ? now : Date.now();
}
