import { create } from 'zustand';
import { db, type TqKeys } from './storage';

export interface PersistedState<T> {
  value: T;
  set: (value: T) => void;
  update: (patch: Partial<T>) => void;
  reset: () => void;
}

/**
 * A zustand store backed by one MMKV key. Stored objects are merged over the defaults, so a field added
 * in a later version is never undefined. `shallow: false` is for dictionaries (seen, progress) that have no defaults.
 */
export function persisted<K extends keyof TqKeys>(key: K, fallback: () => TqKeys[K], shallow = true) {
  const load = (): TqKeys[K] => {
    const stored = db.get(key);
    return shallow && stored && typeof stored === 'object' ? ({ ...(fallback() as object), ...(stored as object) } as TqKeys[K]) : (stored ?? fallback());
  };
  return create<PersistedState<TqKeys[K]>>((set, get) => ({
    value: load(),
    set: (value) => {
      db.set(key, value);
      set({ value });
    },
    update: (patch) => {
      const value = { ...(get().value as object), ...(patch as object) } as TqKeys[K];
      db.set(key, value);
      set({ value });
    },
    reset: () => {
      db.remove(key);
      set({ value: fallback() });
    },
  }));
}
