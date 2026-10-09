import { create } from 'zustand';
import type { RoundResult } from '@/features/play/commit';

interface ResultState {
  last: RoundResult | null;
  set: (r: RoundResult | null) => void;
}

/** What the Results screens show. In memory only: if the app is killed on that screen, Home shows instead. */
export const useResult = create<ResultState>((set) => ({ last: null, set: (last) => set({ last }) }));
