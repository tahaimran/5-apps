import { create } from 'zustand';
import type { Celebration } from '@/domain/celebrations';

export type ActiveCelebration = Celebration & { id: number };

interface CelebrationState {
  current: ActiveCelebration | null;
  show: (c: Celebration) => void;
  dismiss: () => void;
}

let nextId = 1;

export const useCelebration = create<CelebrationState>((set) => ({
  current: null,
  show: (c) => set({ current: { ...c, id: nextId++ } }),
  dismiss: () => set({ current: null }),
}));
