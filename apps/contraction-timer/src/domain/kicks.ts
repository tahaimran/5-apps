/** Kick counter rules, DEVELOPMENT_PLAN.md §8.3. Pure functions; the store passes in `Date.now()`. */
import { HOUR, MINUTE, SECOND, KICK_TARGET_LIMITS } from './defaults';
import { newId } from './session';
import type { KickSession } from './types';

/** Flutters closer together than this count as one movement (the plan's tips say so). */
export const KICK_DEBOUNCE_MS = SECOND;
/** After this long without reaching the target the calm "contact your provider" card appears. */
export const SOFT_LIMIT_MS = 2 * HOUR;
/** After this long a session closes on its own. */
export const HARD_LIMIT_MS = 3 * HOUR;
/** The history keeps this many sessions. */
export const KICK_HISTORY_CAP = 365;

export const clampTarget = (n: number): number => Math.min(KICK_TARGET_LIMITS.max, Math.max(KICK_TARGET_LIMITS.min, Math.round(n)));

export function startKickSession(now: number, target: number, id = newId()): KickSession {
  return { id, startedAt: now, endedAt: null, taps: [], target: clampTarget(target) };
}

export const isComplete = (s: KickSession): boolean => s.targetReachedAt !== undefined;

/** Counts a movement. Ignored when it is too close to the last one, or the target was already reached. */
export function tapKick(s: KickSession, now: number): { session: KickSession; counted: boolean } {
  if (s.endedAt !== null || isComplete(s)) return { session: s, counted: false };
  const last = s.taps[s.taps.length - 1];
  if (last !== undefined && now >= last && now - last < KICK_DEBOUNCE_MS) return { session: s, counted: false };
  const taps = [...s.taps, now];
  const reached = taps.length >= s.target;
  return { session: { ...s, taps, ...(reached ? { targetReachedAt: now } : {}) }, counted: true };
}

/** Takes the last movement back, and the "target reached" mark with it. */
export function undoKick(s: KickSession): KickSession {
  if (s.endedAt !== null || s.taps.length === 0) return s;
  const taps = s.taps.slice(0, -1);
  const { targetReachedAt: _reached, ...rest } = s;
  void _reached;
  return { ...rest, taps };
}

/** Saves the session. A completed one ends when the last movement was counted; otherwise when the person ended it. */
export function finishKick(s: KickSession, now: number): KickSession {
  return { ...s, endedAt: s.targetReachedAt ?? Math.max(now, s.startedAt) };
}

/** Minutes and seconds from the start to the target (or null if it was not reached). */
export const timeToTarget = (s: KickSession): number | null => (s.targetReachedAt === undefined ? null : Math.max(0, s.targetReachedAt - s.startedAt));

export const elapsedKick = (s: KickSession, now: number): number => Math.max(0, (s.endedAt ?? now) - s.startedAt);

/** Plan §5.3: a running session that has not reached its target after 2 hours. */
export const softLimitReached = (s: KickSession, now: number): boolean => s.endedAt === null && !isComplete(s) && now - s.startedAt >= SOFT_LIMIT_MS;

/** Plan §8.3: hard auto-close at 3 hours. */
export const hardLimitReached = (s: KickSession, now: number): boolean => s.endedAt === null && now - s.startedAt >= HARD_LIMIT_MS;

/** Closes a session that ran into the hard limit, at that limit. */
export const autoClose = (s: KickSession): KickSession => ({ ...s, endedAt: s.startedAt + HARD_LIMIT_MS });

export function describeMinutes(ms: number): number {
  return Math.max(1, Math.round(ms / MINUTE));
}
