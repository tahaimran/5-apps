import { useEffect, useRef } from 'react';

/**
 * Calls `onTick(deltaMs)` about every 100 ms while `running`, with the real time elapsed since the last
 * call (so a late timer never loses time). Stopping it, for the explanation, a pause overlay or an ad,
 * simply stops the deltas; resuming starts fresh from "now" so the paused time is never counted.
 */
export function useRoundClock(running: boolean, onTick: (deltaMs: number) => void, intervalMs = 100) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      if (delta > 0) tickRef.current(delta);
    }, intervalMs);
    return () => clearInterval(id);
  }, [running, intervalMs]);
}
