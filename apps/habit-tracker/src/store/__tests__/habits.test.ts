import type { DayKey } from '@/domain/types';

// In-memory stand-in for MMKV; survives module resets like the device's disk survives an app kill.
const mockDisk = new Map<string, Map<string, string | number>>();
jest.mock('react-native-mmkv', () => ({
  createMMKV: ({ id }: { id: string }) => {
    if (!mockDisk.has(id)) mockDisk.set(id, new Map());
    const m = mockDisk.get(id)!;
    return {
      getString: (k: string) => (typeof m.get(k) === 'string' ? (m.get(k) as string) : undefined),
      getNumber: (k: string) => (typeof m.get(k) === 'number' ? (m.get(k) as number) : undefined),
      set: (k: string, v: string | number) => void m.set(k, v),
      remove: (k: string) => m.delete(k),
      getAllKeys: () => [...m.keys()],
      clearAll: () => m.clear(),
    };
  },
}));
jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));

const TODAY = '2026-10-08' as DayKey;
const YESTERDAY = '2026-10-07' as DayKey;

/** Boots the stores from whatever is on the fake disk, like a cold start. */
function boot() {
  let mod!: typeof import('../habits');
  jest.isolateModules(() => {
    mod = require('../habits');
  });
  return mod.useHabits;
}

const water = {
  name: 'Drink water',
  icon: 'cup-water',
  color: '#0EA5E9',
  type: 'count' as const,
  target: 8,
  unit: 'glasses',
  schedule: { kind: 'daily' as const },
  category: 'health',
};

beforeEach(() => mockDisk.clear());

describe('habit store', () => {
  it('starts empty', () => {
    expect(boot().getState().habitOrder).toEqual([]);
  });

  it('adds a habit that survives a restart', () => {
    const first = boot();
    const habit = first.getState().addHabit(water, TODAY);
    const second = boot();
    expect(second.getState().habitOrder).toEqual([habit.id]);
    expect(second.getState().habits[habit.id]).toMatchObject({ name: 'Drink water', createdAt: TODAY });
  });

  it('persists check-ins across a restart', () => {
    const first = boot();
    const { id } = first.getState().addHabit(water, TODAY);
    first.getState().setValue(id, TODAY, 3);
    const second = boot();
    expect(second.getState().entries[id][TODAY].value).toBe(3);
  });

  it('removes the entry when the value drops to zero', () => {
    const store = boot();
    const { id } = store.getState().addHabit(water, TODAY);
    store.getState().setValue(id, TODAY, 2);
    store.getState().setValue(id, TODAY, 0);
    expect(store.getState().entries[id][TODAY]).toBeUndefined();
    expect(boot().getState().entries[id][TODAY]).toBeUndefined();
  });

  it('keeps entries of different habits separate', () => {
    const store = boot();
    const a = store.getState().addHabit(water, TODAY);
    const b = store.getState().addHabit({ ...water, name: 'Walk', type: 'boolean', target: 1 }, TODAY);
    store.getState().setValue(a.id, TODAY, 5);
    expect(store.getState().entries[b.id]).toEqual({});
  });

  it('spends a freeze on a missed day via closeDays', () => {
    const store = boot();
    const { id } = store.getState().addHabit({ ...water, type: 'boolean', target: 1 }, '2026-10-01' as DayKey);
    for (const day of ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'] as DayKey[]) {
      store.getState().setValue(id, day, 1);
    }
    // 10-06 missed, 10-07 done, today 10-08
    store.getState().setValue(id, YESTERDAY, 1);
    // grant a freeze through the same persisted key the store reads
    store.setState({ freezes: { count: 1, log: [] } });
    store.getState().closeDays(TODAY, 1);
    expect(store.getState().entries[id]['2026-10-06' as DayKey]).toMatchObject({ frozen: true });
    expect(store.getState().freezes.count).toBe(0);
    expect(boot().getState().entries[id]['2026-10-06' as DayKey]).toMatchObject({ frozen: true });
  });
});
