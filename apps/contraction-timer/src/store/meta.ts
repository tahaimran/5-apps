import { create } from 'zustand';
import { defaultMeta } from '@/domain/defaults';
import type { Meta } from '@/domain/types';
import { db } from './storage';

interface MetaState {
  meta: Meta;
  update: (patch: Partial<Meta>) => void;
  /** One more cold start (counted once per process). */
  recordLaunch: () => void;
  acknowledgeDisclaimer: (now?: number) => void;
  /** Delete all data: forgets everything but the install date. */
  reset: () => void;
}

const load = (): Meta => {
  const stored = db.get('meta');
  const meta = { ...defaultMeta(), ...stored };
  if (!stored) db.set('meta', meta);
  return meta;
};

/** Onboarding, disclaimer, rating and session-end markers (`ct.meta`). */
export const useMeta = create<MetaState>((set, get) => {
  const save = (meta: Meta) => {
    db.set('meta', meta);
    set({ meta });
  };
  return {
    meta: load(),
    update: (patch) => save({ ...get().meta, ...patch }),
    recordLaunch: () => save({ ...get().meta, launches: get().meta.launches + 1 }),
    acknowledgeDisclaimer: (now = Date.now()) => save({ ...get().meta, disclaimerAckAt: now }),
    reset: () => save({ ...defaultMeta(get().meta.installAt), launches: get().meta.launches }),
  };
});
