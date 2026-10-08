import { create } from 'zustand';
import type { CompletedResult } from '@/domain/types';

interface ResultState {
  last: CompletedResult | null;
  set: (r: CompletedResult | null) => void;
}

/** What the Complete screen shows. In memory only: if the app is killed on that screen, Home shows instead. */
export const useResult = create<ResultState>((set) => ({ last: null, set: (last) => set({ last }) }));
