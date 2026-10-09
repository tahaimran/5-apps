/**
 * What a tap does to a timing session, and the edits allowed afterwards, as pure functions.
 * The store calls these with `Date.now()` taken at the moment of the tap and writes the result to
 * disk straight away; a running timer is only ever `now - startedAt`, never a counter in memory.
 */
import { HOUR, MINUTE, RULE_PRESETS, SECOND } from './defaults';
import { byStart, durationOf, openContraction, isIgnored } from './stats';
import type { Contraction, ContractionSession, ID, Intensity, PatternRule } from './types';

/** A second tap this soon after the last one is a double-tap and is ignored (it must not stop a contraction that just began). */
export const TAP_DEBOUNCE_MS = 500;
/** Plan §5.1: a contraction still running after this gets a gentle "Still going?" line. */
export const LONG_CONTRACTION_MS = 3 * MINUTE;
/** Plan §5.1: after this long with no activity the app asks whether to end the session. */
export const IDLE_PROMPT_MS = 2 * HOUR;
/** Plan §5.1: after this long it ends the session on its own. */
export const IDLE_AUTO_END_MS = 6 * HOUR;
/** The phone's clock may differ from the saved one by this much before it counts as having been set back. */
export const CLOCK_TOLERANCE_MS = 2 * SECOND;
/** An edited or added contraction may not be longer than this. */
export const MAX_EDIT_DURATION_MS = 30 * MINUTE;

export type EditError = 'not-found' | 'open' | 'end-before-start' | 'in-future' | 'too-long' | 'overlaps' | 'too-short';
export type Edit = { ok: true; session: ContractionSession } | { ok: false; reason: EditError };

const fail = (reason: EditError): Edit => ({ ok: false, reason });

/** A random id; the plan's nanoid is not worth a dependency here. Tests pass their own. */
export const newId = (): ID => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function newSession(now: number, rule: PatternRule = RULE_PRESETS['511'], id: ID = newId()): ContractionSession {
  return { id, startedAt: now, endedAt: null, contractions: [], ruleAtStart: rule, lastActivityAt: now };
}

export const isRunning = (s: ContractionSession | null): boolean => !!s && openContraction(s.contractions) !== null;

/** True when a tap at `now` is the second half of a double-tap. */
export const isDoubleTap = (s: ContractionSession | null, now: number): boolean =>
  !!s && now >= s.lastActivityAt && now - s.lastActivityAt < TAP_DEBOUNCE_MS;

/**
 * The one button: starts a contraction (and the session, the first time) or stops the running one.
 * `kind` says which happened so the screen can pick the haptic. A double-tap changes nothing.
 */
export function tap(
  session: ContractionSession | null,
  now: number,
  rule: PatternRule,
  makeId: () => ID = newId,
): { session: ContractionSession; kind: 'started' | 'stopped' | 'ignored' } {
  if (session && isDoubleTap(session, now)) return { session, kind: 'ignored' };
  const base = session ?? newSession(now, rule, makeId());
  const open = openContraction(base.contractions);
  if (open) {
    const contractions = base.contractions.map((c) => (c.id === open.id ? { ...c, endedAt: Math.max(now, c.startedAt) } : c));
    return { session: { ...base, contractions, lastActivityAt: now }, kind: 'stopped' };
  }
  const started: Contraction = { id: makeId(), startedAt: now, endedAt: null };
  return { session: { ...base, contractions: [...base.contractions, started], lastActivityAt: now }, kind: 'started' };
}

/**
 * "Undo last tap" (long-press, plan §5.1). If the last tap started a contraction it is removed (and the
 * session with it when nothing else is in it: returns null); if it stopped one, that one runs again.
 */
export function undoLastTap(session: ContractionSession): ContractionSession | null {
  const open = openContraction(session.contractions);
  if (open) {
    const contractions = session.contractions.filter((c) => c.id !== open.id);
    if (contractions.length === 0) return null;
    return { ...session, contractions, lastActivityAt: lastActivityOf(contractions, session.startedAt) };
  }
  const sorted = [...session.contractions].sort(byStart);
  const last = sorted[sorted.length - 1];
  if (!last) return null;
  const contractions = session.contractions.map((c) => (c.id === last.id ? { ...c, endedAt: null } : c));
  return { ...session, contractions, lastActivityAt: last.startedAt };
}

function lastActivityOf(contractions: readonly Contraction[], fallback: number): number {
  let at = fallback;
  for (const c of contractions) at = Math.max(at, c.endedAt ?? c.startedAt);
  return at;
}

export function setIntensity(session: ContractionSession, id: ID, intensity: Intensity | undefined): ContractionSession {
  return { ...session, contractions: session.contractions.map((c) => (c.id === id ? { ...c, intensity } : c)) };
}

export function setNote(session: ContractionSession, id: ID, note: string): ContractionSession {
  const text = note.trim();
  return { ...session, contractions: session.contractions.map((c) => (c.id === id ? { ...c, note: text || undefined } : c)) };
}

/** Restores a greyed-out short contraction, or greys one out, by an explicit choice. */
export function toggleIgnored(session: ContractionSession, id: ID): ContractionSession {
  return {
    ...session,
    contractions: session.contractions.map((c) => (c.id === id ? { ...c, ignored: !isIgnored(c) } : c)),
  };
}

const endOf = (c: Contraction) => c.endedAt ?? Infinity;
const overlap = (aStart: number, aEnd: number, b: Contraction) => aStart < endOf(b) && b.startedAt < aEnd;

function checkRange(session: ContractionSession, selfId: ID | null, start: number, end: number, now: number): EditError | null {
  if (end <= start) return end < start ? 'end-before-start' : 'too-short';
  if (end > now || start > now) return 'in-future';
  if (end - start > MAX_EDIT_DURATION_MS) return 'too-long';
  if (session.contractions.some((c) => c.id !== selfId && overlap(start, end, c))) return 'overlaps';
  return null;
}

/** Changes the start and/or end of a finished contraction. Refuses impossible times and overlaps. */
export function editTimes(session: ContractionSession, id: ID, patch: { startedAt?: number; endedAt?: number }, now: number): Edit {
  const target = session.contractions.find((c) => c.id === id);
  if (!target) return fail('not-found');
  if (target.endedAt === null) return fail('open');
  const startedAt = patch.startedAt ?? target.startedAt;
  const endedAt = patch.endedAt ?? target.endedAt;
  const error = checkRange(session, id, startedAt, endedAt, now);
  if (error) return fail(error);
  const contractions = session.contractions.map((c) => (c.id === id ? { ...c, startedAt, endedAt } : c));
  return { ok: true, session: { ...session, contractions, lastActivityAt: Math.max(session.lastActivityAt, lastActivityOf(contractions, 0)) } };
}

/** Plan §5.2 "add missed contraction manually". */
export function addContraction(session: ContractionSession, startedAt: number, durationMs: number, now: number, makeId: () => ID = newId): Edit {
  const error = checkRange(session, null, startedAt, startedAt + durationMs, now);
  if (error) return fail(error);
  const added: Contraction = { id: makeId(), startedAt, endedAt: startedAt + durationMs };
  const contractions = [...session.contractions, added];
  return {
    ok: true,
    session: { ...session, contractions, startedAt: Math.min(session.startedAt, startedAt), lastActivityAt: Math.max(session.lastActivityAt, startedAt + durationMs) },
  };
}

export function deleteContraction(session: ContractionSession, id: ID): ContractionSession {
  return { ...session, contractions: session.contractions.filter((c) => c.id !== id) };
}

const strength: Record<Intensity, number> = { mild: 1, moderate: 2, strong: 3 };

/** Joins a finished contraction with the finished one that follows it in time (a tap that was split by mistake). */
export function mergeWithNext(session: ContractionSession, id: ID): Edit {
  const sorted = [...session.contractions].sort(byStart);
  const i = sorted.findIndex((c) => c.id === id);
  if (i < 0) return fail('not-found');
  const a = sorted[i];
  const b = sorted[i + 1];
  if (!b) return fail('not-found');
  if (a.endedAt === null || b.endedAt === null) return fail('open');
  const stronger = [a.intensity, b.intensity].filter((x): x is Intensity => !!x).sort((x, y) => strength[y] - strength[x])[0];
  const note = [a.note, b.note].filter(Boolean).join(' · ') || undefined;
  const merged: Contraction = { id: a.id, startedAt: a.startedAt, endedAt: Math.max(a.endedAt, b.endedAt), intensity: stronger, note };
  const contractions = session.contractions.filter((c) => c.id !== b.id).map((c) => (c.id === a.id ? merged : c));
  return { ok: true, session: { ...session, contractions } };
}

/**
 * Makes a session read back from disk safe to use: a corrupt file may hold more than one running
 * contraction, but only the newest can be running. The older ones are closed at their own start
 * (greyed out, not invented).
 */
export function repairSession(s: ContractionSession): ContractionSession {
  const open = openContraction(s.contractions);
  if (!open) return s;
  const stale = s.contractions.filter((c) => c.endedAt === null && c.id !== open.id);
  if (stale.length === 0) return s;
  return { ...s, contractions: s.contractions.map((c) => (c.endedAt === null && c.id !== open.id ? { ...c, endedAt: c.startedAt } : c)) };
}

/** Start of the session: the earliest contraction, or the saved start for an empty one. */
export function sessionStart(s: ContractionSession): number {
  return s.contractions.length ? Math.min(...s.contractions.map((c) => c.startedAt)) : s.startedAt;
}

/** The end of the last finished contraction (or its start when it was cut short), 0 when there is none. */
export function lastActivityTime(s: ContractionSession): number {
  return s.contractions.length ? lastActivityOf(s.contractions, 0) : 0;
}

/** When the session ended: the stored end, else the end of its last contraction. */
export function sessionEnd(s: ContractionSession): number {
  return s.endedAt ?? (lastActivityTime(s) || s.startedAt);
}

export type IdleStatus = 'active' | 'prompt' | 'autoEnd';

/** Plan §5.1: asks after 2 hours of nothing (unless "Keep" was chosen), ends by itself after 6. */
export function idleStatus(s: ContractionSession, now: number): IdleStatus {
  const idle = now - s.lastActivityAt;
  if (idle < 0) return 'active';
  if (idle >= IDLE_AUTO_END_MS) return 'autoEnd';
  const quietSince = Math.max(s.lastActivityAt, s.snoozedAt ?? 0);
  return now - quietSince >= IDLE_PROMPT_MS ? 'prompt' : 'active';
}

export const snooze = (s: ContractionSession, now: number): ContractionSession => ({ ...s, snoozedAt: now });

/**
 * Closes a session. Ending by hand while a contraction is running stops it now; ending because nothing
 * happened for hours (`auto`) closes a forgotten contraction at its own start, so it is greyed out
 * rather than invented.
 */
export function endSession(s: ContractionSession, now: number, auto = false): ContractionSession {
  const open = openContraction(s.contractions);
  const contractions = s.contractions.map((c) => (open && c.id === open.id ? { ...c, endedAt: auto ? c.startedAt : Math.max(now, c.startedAt) } : c));
  const closed = { ...s, contractions };
  const endedAt = open && !auto ? Math.max(now, open.startedAt) : lastActivityTime(closed) || s.startedAt;
  return { ...closed, endedAt };
}

/** The saved time is in the future: the phone's clock was set back since the last tap. */
export const clockSetBack = (s: ContractionSession | null, now: number): boolean => !!s && now < s.lastActivityAt - CLOCK_TOLERANCE_MS;

/** Elapsed time of the running contraction; never negative even if the clock moved. */
export function elapsedOf(c: Contraction, now: number): number {
  return Math.max(0, (c.endedAt ?? now) - c.startedAt);
}

/** Plan §5.1 "Long contraction": still running after 3 minutes. */
export const isLongRunning = (c: Contraction | null, now: number): boolean => !!c && c.endedAt === null && now - c.startedAt > LONG_CONTRACTION_MS;

export { durationOf };
