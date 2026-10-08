import { mockDisk, resetDisk } from '../../testing/native';
import { act } from 'react';
import { cleanup, render } from '../../testing/render';

const mockFiles = new Map<string, string>();
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri: string;
    get exists() {
      return mockFiles.has(this.uri);
    }
    constructor(dir: string, name?: string) {
      this.uri = name ? `${dir}/${name}` : dir;
    }
    create() {}
    write(text: string) {
      mockFiles.set(this.uri, text);
    }
    async text() {
      return mockFiles.get(this.uri) ?? '';
    }
  },
}));

import { createStore, sharedStore } from '../index';

interface Data {
  count: number;
  name: string;
  list: number[];
  nested: { a: { b: boolean } };
}

beforeEach(() => {
  resetDisk();
  mockFiles.clear();
});
afterEach(cleanup);

describe('get / set / remove', () => {
  it('returns undefined for a key that was never set', () => {
    expect(createStore<Data>('s', 1).get('count')).toBeUndefined();
  });
  it('round-trips numbers, strings, arrays and nested objects', () => {
    const s = createStore<Data>('s', 1);
    s.set('count', 3);
    s.set('name', 'Ana');
    s.set('list', [1, 2, 3]);
    s.set('nested', { a: { b: true } });
    expect(s.get('count')).toBe(3);
    expect(s.get('name')).toBe('Ana');
    expect(s.get('list')).toEqual([1, 2, 3]);
    expect(s.get('nested')).toEqual({ a: { b: true } });
  });
  it('keeps falsy values (0, empty string, false)', () => {
    const s = createStore<{ n: number; s: string; b: boolean }>('s', 1);
    s.set('n', 0);
    s.set('s', '');
    s.set('b', false);
    expect([s.get('n'), s.get('s'), s.get('b')]).toEqual([0, '', false]);
  });
  it('setting undefined removes the key', () => {
    const s = createStore<Data>('s', 1);
    s.set('count', 1);
    s.set('count', undefined as never);
    expect(s.get('count')).toBeUndefined();
  });
  it('remove deletes the key', () => {
    const s = createStore<Data>('s', 1);
    s.set('name', 'x');
    s.remove('name');
    expect(s.get('name')).toBeUndefined();
  });
  it('persists across a new store instance (an app restart)', () => {
    createStore<Data>('s', 1).set('count', 9);
    expect(createStore<Data>('s', 1).get('count')).toBe(9);
  });
  it('keeps stores with different ids separate', () => {
    createStore<Data>('a', 1).set('count', 1);
    expect(createStore<Data>('b', 1).get('count')).toBeUndefined();
  });
  it('treats a corrupted value as missing instead of throwing', () => {
    createStore<Data>('s', 1).set('count', 1);
    mockDisk.get('s')!.set('count', '{not json');
    expect(createStore<Data>('s', 1).get('count')).toBeUndefined();
  });
});

describe('subscribe', () => {
  it('calls listeners on set and remove, and stops after unsubscribe', () => {
    const s = createStore<Data>('s', 1);
    const listener = jest.fn();
    const off = s.subscribe(listener);
    s.set('count', 1);
    s.remove('count');
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    s.set('count', 2);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('versions and migrations', () => {
  it('records the version of a new store', () => {
    createStore('s', 3);
    expect(mockDisk.get('s')!.get('__version')).toBe(3);
  });
  it('does not touch data when the version is unchanged', () => {
    const migrate = jest.fn((d) => d);
    createStore<Data>('s', 2, { 2: migrate }).set('count', 1);
    createStore<Data>('s', 2, { 2: migrate });
    expect(migrate).not.toHaveBeenCalled();
  });
  it('runs only the migrations above the stored version, in order, with the old data', () => {
    const calls: string[] = [];
    const seed = createStore<Record<string, unknown>>('s', 1);
    seed.set('count', 1);
    const migrations = {
      2: (d: Record<string, unknown>) => {
        calls.push('2');
        return { ...d, count: (d.count as number) + 10 };
      },
      3: (d: Record<string, unknown>) => {
        calls.push('3');
        return { ...d, count: (d.count as number) * 2, added: true };
      },
    };
    const s = createStore<Record<string, unknown>>('s', 3, migrations);
    expect(calls).toEqual(['2', '3']);
    expect(s.get('count')).toBe(22);
    expect(s.get('added')).toBe(true);
    expect(mockDisk.get('s')!.get('__version')).toBe(3);
    // a second open does not migrate again
    createStore('s', 3, migrations);
    expect(calls).toEqual(['2', '3']);
  });
  it('skips versions that have no migration', () => {
    createStore<Data>('s', 1).set('count', 5);
    const s = createStore<Data>('s', 4, { 3: (d) => ({ ...d, count: 6 }) });
    expect(s.get('count')).toBe(6);
  });
  it('can drop and rename keys', () => {
    const seed = createStore<Record<string, unknown>>('s', 1);
    seed.set('old', 1);
    seed.set('keep', 2);
    const s = createStore<Record<string, unknown>>('s', 2, {
      2: ({ old, ...rest }) => ({ ...rest, renamed: old }),
    });
    expect(s.get('old')).toBeUndefined();
    expect(s.get('renamed')).toBe(1);
    expect(s.get('keep')).toBe(2);
  });
  it('leaves the data intact if a migration throws', () => {
    createStore<Data>('s', 1).set('count', 1);
    expect(() =>
      createStore<Data>('s', 2, {
        2: () => {
          throw new Error('boom');
        },
      }),
    ).toThrow('boom');
    expect(createStore<Data>('s', 1).get('count')).toBe(1);
    expect(mockDisk.get('s')!.get('__version')).toBe(1);
  });
  it('does not call migrations for a brand-new store', () => {
    const migrate = jest.fn((d) => d);
    createStore('fresh', 5, { 2: migrate, 5: migrate });
    expect(migrate).not.toHaveBeenCalled();
  });
});

describe('useStored', () => {
  function Probe({ store, onValue }: { store: ReturnType<typeof createStore<Data>>; onValue: (v: number, set: (n: number) => void) => void }) {
    const [value, setValue] = store.useStored('count', 7);
    onValue(value, setValue);
    return null;
  }

  it('starts with the fallback and follows set calls from anywhere', async () => {
    const store = createStore<Data>('s', 1);
    const seen: number[] = [];
    await render(<Probe store={store} onValue={(v) => seen.push(v)} />);
    expect(seen.at(-1)).toBe(7);
    await act(async () => store.set('count', 3));
    expect(seen.at(-1)).toBe(3);
  });
  it('shows the stored value on first render', async () => {
    const store = createStore<Data>('s', 1);
    store.set('count', 42);
    const seen: number[] = [];
    await render(<Probe store={store} onValue={(v) => seen.push(v)} />);
    expect(seen[0]).toBe(42);
  });
  it('the setter writes through to the store', async () => {
    const store = createStore<Data>('s', 1);
    let setter!: (n: number) => void;
    await render(<Probe store={store} onValue={(_v, set) => (setter = set)} />);
    await act(async () => setter(11));
    expect(store.get('count')).toBe(11);
  });
  it('falls back again after the key is removed', async () => {
    const store = createStore<Data>('s', 1);
    store.set('count', 5);
    const seen: number[] = [];
    await render(<Probe store={store} onValue={(v) => seen.push(v)} />);
    await act(async () => store.remove('count'));
    expect(seen.at(-1)).toBe(7);
  });
  it('re-renders only when its own key changes', async () => {
    const store = createStore<Data>('s', 1);
    let renders = 0;
    await render(<Probe store={store} onValue={() => renders++} />);
    const before = renders;
    await act(async () => store.set('name', 'other key'));
    expect(renders).toBe(before);
  });
});

describe('backup', () => {
  it('writes a JSON file and returns its uri', async () => {
    const s = createStore<Data>('s', 2);
    s.set('count', 1);
    const uri = await s.exportBackup();
    expect(uri).toBe('file:///cache/s-backup.json');
    expect(JSON.parse(mockFiles.get(uri)!)).toEqual({ id: 's', version: 2, data: { count: 1 } });
  });
  it('restores into a fresh store, replacing what was there', async () => {
    const a = createStore<Data>('s', 1);
    a.set('count', 1);
    a.set('name', 'a');
    const uri = await a.exportBackup();
    resetDisk();
    const b = createStore<Data>('s', 1);
    b.set('list', [9]);
    await b.importBackup(uri);
    expect(b.get('count')).toBe(1);
    expect(b.get('name')).toBe('a');
    expect(b.get('list')).toBeUndefined();
  });
  it('notifies subscribers after an import', async () => {
    const s = createStore<Data>('s', 1);
    s.set('count', 1);
    const uri = await s.exportBackup();
    const listener = jest.fn();
    s.subscribe(listener);
    await s.importBackup(uri);
    expect(listener).toHaveBeenCalled();
  });
  it('rejects a file from another store, bad JSON, and a missing body', async () => {
    const s = createStore<Data>('s', 1);
    mockFiles.set('f1', JSON.stringify({ id: 'other', version: 1, data: {} }));
    mockFiles.set('f2', 'nope');
    mockFiles.set('f3', JSON.stringify({ id: 's', version: 1 }));
    await expect(s.importBackup('f1')).rejects.toThrow('Invalid backup file');
    await expect(s.importBackup('f2')).rejects.toThrow();
    await expect(s.importBackup('f3')).rejects.toThrow('Invalid backup file');
  });
  it('rejects a backup from a newer version and keeps current data', async () => {
    const s = createStore<Data>('s', 1);
    s.set('count', 1);
    mockFiles.set('f', JSON.stringify({ id: 's', version: 2, data: { count: 99 } }));
    await expect(s.importBackup('f')).rejects.toThrow('newer app version');
    expect(s.get('count')).toBe(1);
  });
  it('migrates an older backup up to the current version', async () => {
    const s = createStore<Data>('s', 3, {
      2: (d) => ({ ...d, count: (d.count as number) + 1 }),
      3: (d) => ({ ...d, count: (d.count as number) * 10 }),
    });
    mockFiles.set('f', JSON.stringify({ id: 's', version: 1, data: { count: 1 } }));
    await s.importBackup('f');
    expect(s.get('count')).toBe(20);
  });
});

describe('sharedStore', () => {
  const fresh = () => {
    let m!: typeof import('../index');
    jest.isolateModules(() => {
      m = require('../index');
    });
    return m;
  };

  beforeEach(() => jest.useFakeTimers({ now: 1_700_000_000_000, doNotFake: ['nextTick', 'setImmediate'] }));
  afterEach(() => jest.useRealTimers());

  it('records the first-open time on first launch', () => {
    expect(fresh().sharedStore.get('install.firstOpenAt')).toBe(1_700_000_000_000);
  });
  it('never overwrites it on later launches', () => {
    fresh();
    jest.setSystemTime(1_800_000_000_000);
    expect(fresh().sharedStore.get('install.firstOpenAt')).toBe(1_700_000_000_000);
  });
  it('is its own store, separate from an app store', () => {
    const { sharedStore: shared, createStore: create } = fresh();
    create<{ x: number }>('app', 1).set('x', 1);
    expect(shared.get('onboarding.completedAt')).toBeUndefined();
  });
});
