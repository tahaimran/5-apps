import { create } from 'zustand';
import type { RoundState } from '@/domain/round';

interface RoundStore {
  /** Identifies the round behind a `quiz/[sessionId]` route. */
  sessionId: string | null;
  state: RoundState | null;
  startedAt: number;
  /** The round was already turned into a result (progress, XP, streak), so it is never applied twice. */
  committed: boolean;
  begin: (sessionId: string, state: RoundState) => void;
  apply: (fn: (s: RoundState) => RoundState) => void;
  markCommitted: () => void;
  clear: () => void;
}

/** The round in progress. In memory only: a round that is killed with the app is simply lost (plan §4). */
export const useRound = create<RoundStore>((set, get) => ({
  sessionId: null,
  state: null,
  startedAt: 0,
  committed: false,
  begin: (sessionId, state) => set({ sessionId, state, startedAt: Date.now(), committed: false }),
  apply: (fn) => {
    const s = get().state;
    if (s) set({ state: fn(s) });
  },
  markCommitted: () => set({ committed: true }),
  clear: () => set({ sessionId: null, state: null, committed: false }),
}));
