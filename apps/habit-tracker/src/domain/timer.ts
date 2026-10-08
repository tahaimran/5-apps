import type { Entry } from './types';

/** A forgotten running timer never credits more than this. */
export const MAX_TIMER_CREDIT_SECONDS = 12 * 3600;

const runningCredit = (entry: Entry, now: number) =>
  entry.timerStartedAt === undefined
    ? 0
    : Math.min(Math.max(0, Math.floor((now - entry.timerStartedAt) / 1000)), MAX_TIMER_CREDIT_SECONDS);

/**
 * Seconds logged, including time from a running timer. The start is a timestamp (not an
 * interval tick) so elapsed time survives the app being backgrounded or killed.
 */
export function elapsedSeconds(entry: Entry | undefined, now: number): number {
  return entry ? entry.value + runningCredit(entry, now) : 0;
}

export const isRunning = (entry: Entry | undefined): boolean => entry?.timerStartedAt !== undefined;

export function startTimer(entry: Entry | undefined, now: number): Entry {
  if (entry && isRunning(entry)) return entry;
  return { value: entry?.value ?? 0, updatedAt: now, timerStartedAt: now };
}

/** Folds the running time into `value` and stops the timer. */
export function pauseTimer(entry: Entry | undefined, now: number): Entry | undefined {
  if (!entry || !isRunning(entry)) return entry;
  return { value: entry.value + runningCredit(entry, now), updatedAt: now };
}

/** Manual "add minutes" (or negative to undo). Keeps a running timer running. */
export function addSeconds(entry: Entry | undefined, seconds: number, now: number): Entry {
  const value = Math.max(0, (entry?.value ?? 0) + seconds);
  return { ...entry, value, updatedAt: now };
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
