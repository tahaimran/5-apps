import { create } from 'zustand';
import { defaultStats } from '@/domain/defaults';
import { recordStats } from '@/domain/scoring';
import type { SavedGame, Stats } from '@/domain/types';
import { db } from './storage';

interface StatsState {
  stats: Stats;
  /** One more cold start (counted once per process). */
  recordSession: () => void;
  recordPuzzle: (game: SavedGame) => void;
  reset: () => void;
}

const load = (): Stats => ({ ...defaultStats(), ...db.get('stats') });

/** Lifetime counters (`ws.stats`). */
export const useStats = create<StatsState>((set, get) => {
  const save = (stats: Stats) => {
    db.set('stats', stats);
    set({ stats });
  };
  return {
    stats: load(),
    recordSession: () => save({ ...get().stats, sessions: get().stats.sessions + 1 }),
    recordPuzzle: (game) => save(recordStats(get().stats, game)),
    reset: () => save(defaultStats()),
  };
});
