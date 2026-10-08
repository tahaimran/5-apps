import { useCallback, useSyncExternalStore } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { File, Paths } from 'expo-file-system';

const VERSION_KEY = '__version';

export type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

export interface Store<T> {
  get<K extends keyof T>(key: K): T[K] | undefined;
  set<K extends keyof T>(key: K, value: T[K]): void;
  remove<K extends keyof T>(key: K): void;
  /** Every key currently stored (for sharded keys such as `logs:2026-10`). */
  keys(): string[];
  /** Subscribe to any change in this store. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  useStored<K extends keyof T>(key: K, fallback: T[K]): [T[K], (v: T[K]) => void];
  /** Writes all data to a JSON file in the cache directory and returns its uri. */
  exportBackup(): Promise<string>;
  /** Replaces all data with the contents of a backup file made by `exportBackup`. */
  importBackup(uri: string): Promise<void>;
}

/**
 * Typed, versioned MMKV store. Values are JSON-encoded.
 * `migrations[n]` upgrades the whole data snapshot from version n-1 to n and runs on
 * open for every version above the stored one.
 */
export function createStore<T extends object>(
  id: string,
  version: number,
  migrations: Record<number, Migration> = {},
): Store<T> {
  const mmkv = createMMKV({ id });
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  const readAll = (): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const key of mmkv.getAllKeys()) {
      if (key === VERSION_KEY) continue;
      const raw = mmkv.getString(key);
      if (raw === undefined) continue;
      try {
        out[key] = JSON.parse(raw);
      } catch {
        // skip unreadable value
      }
    }
    return out;
  };

  const writeAll = (data: Record<string, unknown>) => {
    mmkv.clearAll();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) mmkv.set(key, JSON.stringify(value));
    }
    mmkv.set(VERSION_KEY, version);
  };

  const storedVersion = mmkv.getNumber(VERSION_KEY);
  if (storedVersion === undefined) {
    mmkv.set(VERSION_KEY, version);
  } else if (storedVersion < version) {
    let data = readAll();
    for (let v = storedVersion + 1; v <= version; v++) {
      const migrate = migrations[v];
      if (migrate) data = migrate(data);
    }
    writeAll(data);
  }

  const get = <K extends keyof T>(key: K): T[K] | undefined => {
    const raw = mmkv.getString(String(key));
    if (raw === undefined) return undefined;
    try {
      return JSON.parse(raw) as T[K];
    } catch {
      return undefined;
    }
  };

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    if (value === undefined) mmkv.remove(String(key));
    else mmkv.set(String(key), JSON.stringify(value));
    notify();
  };

  const remove = <K extends keyof T>(key: K) => {
    mmkv.remove(String(key));
    notify();
  };

  const keys = () => mmkv.getAllKeys().filter((k) => k !== VERSION_KEY);

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  // Cached snapshot per hook call: the raw JSON string is a stable primitive for useSyncExternalStore.
  const useStored = <K extends keyof T>(key: K, fallback: T[K]): [T[K], (v: T[K]) => void] => {
    const raw = useSyncExternalStore(subscribe, () => mmkv.getString(String(key)));
    let value = fallback;
    if (raw !== undefined) {
      try {
        value = JSON.parse(raw) as T[K];
      } catch {
        value = fallback;
      }
    }
    const setValue = useCallback((v: T[K]) => set(key, v), [key]);
    return [value, setValue];
  };

  const exportBackup = async () => {
    const file = new File(Paths.cache, `${id}-backup.json`);
    if (!file.exists) file.create();
    file.write(JSON.stringify({ id, version, data: readAll() }));
    return file.uri;
  };

  const importBackup = async (uri: string) => {
    const parsed = JSON.parse(await new File(uri).text()) as {
      id?: string;
      version?: number;
      data?: Record<string, unknown>;
    };
    if (parsed.id !== id || typeof parsed.version !== 'number' || !parsed.data) {
      throw new Error('Invalid backup file');
    }
    if (parsed.version > version) throw new Error('Backup was made by a newer app version');
    let data = parsed.data;
    for (let v = parsed.version + 1; v <= version; v++) {
      const migrate = migrations[v];
      if (migrate) data = migrate(data);
    }
    writeAll(data);
    notify();
  };

  return { get, set, remove, keys, subscribe, useStored, exportBackup, importBackup };
}

/** Keys used by the shared modules themselves (onboarding, review, ads, theme, crosspromo). */
export interface SharedKeys {
  'install.firstOpenAt': number;
  'session.count': number;
  'onboarding.completedAt': number;
  'theme.mode': 'system' | 'light' | 'dark' | 'high-contrast';
  'review.positiveEvents': number;
  'review.lastAskedAt': number;
  'crosspromo.cursor': number;
}

export const sharedStore = createStore<SharedKeys>('shared', 1, {});

if (sharedStore.get('install.firstOpenAt') === undefined) {
  sharedStore.set('install.firstOpenAt', Date.now());
}
