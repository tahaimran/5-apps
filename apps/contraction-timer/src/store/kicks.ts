import { create } from 'zustand';
import { autoClose, finishKick, hardLimitReached, KICK_HISTORY_CAP, softLimitReached, startKickSession, tapKick, undoKick } from '@/domain/kicks';
import type { ID, KickSession } from '@/domain/types';
import { useMeta } from './meta';
import { useSettings } from './settings';
import { db } from './storage';

export type KickTap = 'counted' | 'ignored' | 'reached';

interface KicksState {
  /** The count in progress (`ct.activeKick`), written on every tap. */
  active: KickSession | null;
  /** Saved counts, newest first, at most 365 (`ct.kicks`). */
  history: KickSession[];
  start: (now?: number) => void;
  tap: (now?: number) => KickTap;
  undo: () => void;
  /** Saves the count. Returns it, or null when nothing was counted (an empty count is not worth keeping). */
  finish: (now?: number) => KickSession | null;
  /** Applies the 2-hour and 3-hour rules (cold start, foreground, every tick of the screen). */
  checkLimits: (now?: number) => 'ok' | 'soft' | 'closed';
  remove: (id: ID) => KickSession | null;
  restore: (session: KickSession) => void;
  reset: () => void;
}

const load = () => ({ active: db.get('activeKick') ?? null, history: db.get('kicks') ?? [] });

/** Kick counting (`ct.activeKick`, `ct.kicks`). Same rule as the timer: every tap is on disk before the screen changes. */
export const useKicks = create<KicksState>((set, get) => {
  const writeActive = (active: KickSession | null) => {
    db.set('activeKick', active);
    set({ active });
  };
  const save = (s: KickSession) => {
    const history = [s, ...get().history.filter((h) => h.id !== s.id)].slice(0, KICK_HISTORY_CAP);
    db.set('kicks', history);
    set({ history });
    useMeta.getState().update({ lastKickEndedAt: s.endedAt ?? undefined });
  };
  return {
    ...load(),
    start: (now = Date.now()) => {
      if (get().active) return;
      writeActive(startKickSession(now, useSettings.getState().settings.kickTarget));
    },
    tap: (now = Date.now()) => {
      const s = get().active;
      if (!s) return 'ignored';
      const { session, counted } = tapKick(s, now);
      if (!counted) return 'ignored';
      writeActive(session);
      return session.targetReachedAt !== undefined ? 'reached' : 'counted';
    },
    undo: () => {
      const s = get().active;
      if (s) writeActive(undoKick(s));
    },
    finish: (now = Date.now()) => {
      const s = get().active;
      if (!s) return null;
      if (s.taps.length === 0) {
        writeActive(null);
        useMeta.getState().update({ lastKickEndedAt: now });
        return null;
      }
      const done = finishKick(s, now);
      save(done);
      writeActive(null);
      return done;
    },
    checkLimits: (now = Date.now()) => {
      const s = get().active;
      if (!s) return 'ok';
      if (hardLimitReached(s, now)) {
        const closed = autoClose(s);
        if (closed.taps.length > 0) save(closed);
        else useMeta.getState().update({ lastKickEndedAt: closed.endedAt ?? now });
        writeActive(null);
        return 'closed';
      }
      if (softLimitReached(s, now)) {
        if (useMeta.getState().meta.lastKickSoftLimitAt === undefined || useMeta.getState().meta.lastKickSoftLimitAt! < s.startedAt) {
          useMeta.getState().update({ lastKickSoftLimitAt: now });
        }
        return 'soft';
      }
      return 'ok';
    },
    remove: (id) => {
      const found = get().history.find((h) => h.id === id) ?? null;
      if (!found) return null;
      const history = get().history.filter((h) => h.id !== id);
      db.set('kicks', history);
      set({ history });
      return found;
    },
    restore: (session) => {
      const history = [...get().history.filter((h) => h.id !== session.id), session].sort((a, b) => b.startedAt - a.startedAt).slice(0, KICK_HISTORY_CAP);
      db.set('kicks', history);
      set({ history });
    },
    reset: () => {
      db.remove('activeKick');
      db.remove('kicks');
      set({ active: null, history: [] });
    },
  };
});

export const reloadKicksFromDisk = () => useKicks.setState(load());
