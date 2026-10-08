import { create } from 'zustand';
import { defaultMeta } from '@/domain/defaults';
import type { AppMeta } from '@/domain/types';
import { db } from './storage';

interface MetaState {
  meta: AppMeta;
  update: (patch: Partial<AppMeta>) => void;
  /** One more cold start (counted once per process). */
  recordLaunch: () => void;
}

/** Launch and ad/review counters (`water.meta`). */
export const useMeta = create<MetaState>((set, get) => ({
  meta: { ...defaultMeta(), ...db.get('meta') },
  update: (patch) => {
    const meta = { ...get().meta, ...patch };
    db.set('meta', meta);
    set({ meta });
  },
  recordLaunch: () => get().update({ launches: get().meta.launches + 1 }),
}));
