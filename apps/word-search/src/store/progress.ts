import { create } from 'zustand';
import { defaultPackProgress } from '@/domain/defaults';
import { recordLevel } from '@/domain/scoring';
import type { Difficulty, LevelTrack, PackId, PackProgress, Stars } from '@/domain/types';
import { db } from './storage';

interface ProgressState {
  packs: Record<PackId, PackProgress>;
  /** Stores a finished level (best stars kept, current level advanced). */
  record: (packId: PackId, difficulty: Difficulty, level: number, stars: Stars) => void;
  reset: () => void;
}

/** Levels and stars per pack and difficulty (`ws.progress.packs`). */
export const useProgress = create<ProgressState>((set, get) => ({
  packs: db.get('progress.packs') ?? {},
  record: (packId, difficulty, level, stars) => {
    const packs = { ...get().packs, [packId]: recordLevel(get().packs[packId], difficulty, level, stars) };
    db.set('progress.packs', packs);
    set({ packs });
  },
  reset: () => {
    db.remove('progress.packs');
    set({ packs: {} });
  },
}));

/** The track of a pack at a difficulty; a pack never played starts at level 1. */
export const trackOf = (packs: Record<PackId, PackProgress>, packId: PackId, difficulty: Difficulty): LevelTrack =>
  (packs[packId] ?? defaultPackProgress())[difficulty];
