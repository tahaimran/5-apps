import { create } from 'zustand';
import { evaluatePattern, nextPatternState } from '@/domain/pattern';
import {
  addContraction as addToSession,
  deleteContraction as deleteFromSession,
  editTimes as editSessionTimes,
  endSession,
  idleStatus,
  mergeWithNext as mergeInSession,
  newId,
  repairSession,
  setIntensity as setSessionIntensity,
  setNote as setSessionNote,
  snooze,
  tap as tapSession,
  toggleIgnored as toggleSessionIgnored,
  undoLastTap,
  type Edit,
} from '@/domain/session';
import type { ContractionSession, ID, Intensity } from '@/domain/types';
import { useMeta } from './meta';
import { useSettings } from './settings';
import { db } from './storage';

/** `lastMatchAt` is saved at most this often while a match goes on. */
const LAST_MATCH_SAVE_MS = 30_000;

export type TapKind = 'started' | 'stopped' | 'ignored';

interface SessionsState {
  /** The session being timed, or null. Mirrors `ct.activeSession`, which is written before this changes. */
  active: ContractionSession | null;
  /** Archived session ids, newest first (`ct.sessions.index`). */
  index: ID[];
  archived: Record<ID, ContractionSession>;
  /** The app was started with a session already open: the Timer says "Timing restored" once. */
  restored: boolean;
  /** The one button. `now` is read at the moment of the tap, never earlier. */
  tap: (now?: number) => TapKind;
  undoTap: () => void;
  /** Ends the open session and files it in the history. `auto` closes a forgotten contraction at its start. */
  endActive: (now?: number, auto?: boolean) => ContractionSession | null;
  /** "Keep" on the idle prompt. */
  keepActive: (now?: number) => void;
  /** Re-checks the idle rules (cold start, foreground): ends the session after 6 hours of nothing. */
  checkIdle: (now?: number) => 'active' | 'prompt' | 'ended';
  /** Re-evaluates the pattern rule against the open session; returns true when a new episode began (the banner fires). */
  evaluate: (now?: number) => boolean;
  dismissPattern: () => void;
  /** Edits any session, open or filed. */
  setIntensity: (sessionId: ID, id: ID, intensity: Intensity | undefined) => void;
  setNote: (sessionId: ID, id: ID, note: string) => void;
  toggleIgnored: (sessionId: ID, id: ID) => void;
  editTimes: (sessionId: ID, id: ID, patch: { startedAt?: number; endedAt?: number }, now?: number) => Edit | null;
  addContraction: (sessionId: ID, startedAt: number, durationMs: number, now?: number) => Edit | null;
  deleteContraction: (sessionId: ID, id: ID) => void;
  mergeWithNext: (sessionId: ID, id: ID) => Edit | null;
  /** Puts back a contraction taken out by `deleteContraction` (the 5-second undo). */
  restoreSession: (session: ContractionSession) => void;
  deleteSession: (id: ID) => ContractionSession | null;
  get: (id: ID) => ContractionSession | null;
  reset: () => void;
}

const loadArchive = (index: ID[]): Record<ID, ContractionSession> => {
  const out: Record<ID, ContractionSession> = {};
  for (const id of index) {
    const s = db.get(`session.${id}`);
    if (s) out[id] = s;
  }
  return out;
};

/** Reads everything back from disk (also used by tests to simulate a cold start). */
function load() {
  const stored = db.get('activeSession');
  const index = (db.get('sessions.index') ?? []).filter((id) => db.get(`session.${id}`) !== undefined);
  // A kill between "file the session" and "clear the open one" leaves both: the filed copy wins.
  const stale = !!stored && index.includes(stored.id);
  if (stale) db.set('activeSession', null);
  return {
    active: stored && !stale ? repairSession(stored) : null,
    index,
    archived: loadArchive(index),
    restored: !!stored && !stale,
  };
}

/**
 * Timing sessions (`ct.activeSession`, `ct.sessions.index`, `ct.session.<id>`). Every change is written to
 * MMKV, synchronously, before it reaches the screen, so killing the app at any moment loses nothing: the
 * running timer is `now - startedAt` on whatever the disk holds.
 */
export const useSessions = create<SessionsState>((set, get) => {
  const writeActive = (active: ContractionSession | null) => {
    db.set('activeSession', active);
    set({ active });
  };
  const writeArchived = (s: ContractionSession) => {
    db.set(`session.${s.id}`, s);
    set({ archived: { ...get().archived, [s.id]: s } });
  };
  /** Applies `fn` to the open session or a filed one, whichever has this id. */
  const mutate = (sessionId: ID, fn: (s: ContractionSession) => ContractionSession) => {
    const { active, archived } = get();
    if (active?.id === sessionId) writeActive(fn(active));
    else if (archived[sessionId]) writeArchived(fn(archived[sessionId]));
  };
  const mutateEdit = (sessionId: ID, fn: (s: ContractionSession) => Edit): Edit | null => {
    const { active, archived } = get();
    const target = active?.id === sessionId ? active : archived[sessionId];
    if (!target) return null;
    const result = fn(target);
    if (result.ok) mutate(sessionId, () => result.session);
    return result;
  };
  const file = (s: ContractionSession) => {
    writeArchived(s);
    const index = [s.id, ...get().index.filter((id) => id !== s.id)];
    db.set('sessions.index', index);
    set({ index });
  };

  return {
    ...load(),
    tap: (now = Date.now()) => {
      const { session, kind } = tapSession(get().active, now, useSettings.getState().settings.rule, newId);
      if (kind !== 'ignored') writeActive(session);
      return kind;
    },
    undoTap: () => {
      const s = get().active;
      if (!s) return;
      writeActive(undoLastTap(s));
    },
    endActive: (now = Date.now(), auto = false) => {
      const s = get().active;
      if (!s) return null;
      const ended = endSession(s, now, auto);
      // Written in this order so a kill in between leaves the session in the history or still open, never lost.
      file(ended);
      writeActive(null);
      useMeta.getState().update({ lastSessionEndedAt: ended.endedAt ?? now });
      return ended;
    },
    keepActive: (now = Date.now()) => {
      const s = get().active;
      if (s) writeActive(snooze(s, now));
    },
    checkIdle: (now = Date.now()) => {
      const s = get().active;
      if (!s) return 'active';
      const status = idleStatus(s, now);
      if (status === 'autoEnd') {
        get().endActive(now, true);
        return 'ended';
      }
      return status;
    },
    evaluate: (now = Date.now()) => {
      const current = get().active;
      if (!current) return false;
      // The rule in Settings is the one in effect. If it was changed during the session, the match history
      // of the old rule no longer applies, and the summary should name the rule that was really checked.
      const rule = useSettings.getState().settings.rule;
      const ruleChanged = JSON.stringify(rule) !== JSON.stringify(current.ruleAtStart);
      const s: ContractionSession = ruleChanged ? { ...current, ruleAtStart: rule, pattern: undefined, patternMatchedAt: undefined } : current;
      const matches = evaluatePattern(rule, s.contractions, now).matches;
      const { state, fire } = nextPatternState(s.pattern, matches, now);
      const prev = s.pattern ?? {};
      // While a match simply continues only `lastMatchAt` moves; saving that every second would be wasted writes.
      const trivial =
        !fire &&
        state.episodeStartedAt === prev.episodeStartedAt &&
        state.dismissed === prev.dismissed &&
        (state.lastMatchAt ?? 0) - (prev.lastMatchAt ?? 0) < LAST_MATCH_SAVE_MS;
      if (trivial) {
        if (ruleChanged) writeActive(s);
        return false;
      }
      writeActive({ ...s, pattern: state, ...(fire && s.patternMatchedAt === undefined ? { patternMatchedAt: now } : {}) });
      return fire;
    },
    dismissPattern: () => {
      const s = get().active;
      if (s?.pattern) writeActive({ ...s, pattern: { ...s.pattern, dismissed: true } });
    },
    setIntensity: (sessionId, id, intensity) => mutate(sessionId, (s) => setSessionIntensity(s, id, intensity)),
    setNote: (sessionId, id, note) => mutate(sessionId, (s) => setSessionNote(s, id, note)),
    toggleIgnored: (sessionId, id) => mutate(sessionId, (s) => toggleSessionIgnored(s, id)),
    editTimes: (sessionId, id, patch, now = Date.now()) => mutateEdit(sessionId, (s) => editSessionTimes(s, id, patch, now)),
    addContraction: (sessionId, startedAt, durationMs, now = Date.now()) => mutateEdit(sessionId, (s) => addToSession(s, startedAt, durationMs, now)),
    deleteContraction: (sessionId, id) => mutate(sessionId, (s) => deleteFromSession(s, id)),
    mergeWithNext: (sessionId, id) => mutateEdit(sessionId, (s) => mergeInSession(s, id)),
    restoreSession: (session) => mutate(session.id, () => session),
    deleteSession: (id) => {
      const s = get().archived[id] ?? null;
      if (!s) return null;
      const index = get().index.filter((x) => x !== id);
      db.set('sessions.index', index);
      db.remove(`session.${id}`);
      const { [id]: _gone, ...rest } = get().archived;
      void _gone;
      set({ index, archived: rest });
      return s;
    },
    get: (id) => (get().active?.id === id ? get().active : (get().archived[id] ?? null)),
    reset: () => {
      for (const id of get().index) db.remove(`session.${id}`);
      db.remove('sessions.index');
      db.remove('activeSession');
      set({ active: null, index: [], archived: {}, restored: false });
    },
  };
});

/** Tests: reads the disk again, as a cold start would. */
export const reloadSessionsFromDisk = () => useSessions.setState(load());
