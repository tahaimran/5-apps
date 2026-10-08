import type { DayKey } from '@/domain/types';
import type { HabitDraft } from '@/domain/validate';

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

const water: HabitDraft = {
  name: 'Drink water',
  icon: 'cup-water',
  color: '#0EA5E9',
  type: 'count',
  target: 8,
  unit: 'glasses',
  schedule: { kind: 'daily' },
  category: 'health',
  createdAt: TODAY,
  reminderTime: null,
};

beforeEach(() => mockDisk.clear());

describe('habit store', () => {
  it('starts empty', () => {
    expect(boot().getState().habitOrder).toEqual([]);
  });

  it('adds a habit that survives a restart', () => {
    const first = boot();
    const habit = first.getState().addHabit(water);
    const second = boot();
    expect(second.getState().habitOrder).toEqual([habit.id]);
    expect(second.getState().habits[habit.id]).toMatchObject({ name: 'Drink water', createdAt: TODAY });
  });

  it('persists check-ins across a restart', () => {
    const first = boot();
    const { id } = first.getState().addHabit(water);
    first.getState().setValue(id, TODAY, 3);
    const second = boot();
    expect(second.getState().entries[id][TODAY].value).toBe(3);
  });

  it('removes the entry when the value drops to zero', () => {
    const store = boot();
    const { id } = store.getState().addHabit(water);
    store.getState().setValue(id, TODAY, 2);
    store.getState().setValue(id, TODAY, 0);
    expect(store.getState().entries[id][TODAY]).toBeUndefined();
    expect(boot().getState().entries[id][TODAY]).toBeUndefined();
  });

  it('keeps entries of different habits separate', () => {
    const store = boot();
    const a = store.getState().addHabit(water);
    const b = store.getState().addHabit({ ...water, name: 'Walk', type: 'boolean', target: 1 });
    store.getState().setValue(a.id, TODAY, 5);
    expect(store.getState().entries[b.id]).toEqual({});
  });

  it('spends a freeze on a missed day via closeDays', () => {
    const store = boot();
    const { id } = store.getState().addHabit({ ...water, type: 'boolean', target: 1, createdAt: '2026-10-01' as DayKey });
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

describe('managing habits', () => {
  it('edits a habit and keeps its history', () => {
    const store = boot();
    const { id } = store.getState().addHabit(water);
    store.getState().setValue(id, TODAY, 4);
    store.getState().updateHabit(id, { ...water, name: 'Water', target: 10 });
    const again = boot();
    expect(again.getState().habits[id]).toMatchObject({ name: 'Water', target: 10 });
    expect(again.getState().entries[id][TODAY].value).toBe(4);
  });

  it('stores a reminder time and keeps notification ids when it is unchanged', () => {
    const store = boot();
    const { id } = store.getState().addHabit({ ...water, reminderTime: '08:00' });
    expect(store.getState().habits[id].reminders).toEqual([{ time: '08:00', notifIds: [] }]);
    store.setState({ habits: { [id]: { ...store.getState().habits[id], reminders: [{ time: '08:00', notifIds: ['n1'] }] } } });
    store.getState().updateHabit(id, { ...water, reminderTime: '08:00' });
    expect(store.getState().habits[id].reminders[0].notifIds).toEqual(['n1']);
    store.getState().updateHabit(id, { ...water, reminderTime: null });
    expect(store.getState().habits[id].reminders).toEqual([]);
  });

  it('archives (hidden, history kept) and unarchives', () => {
    const store = boot();
    const a = store.getState().addHabit(water);
    const b = store.getState().addHabit({ ...water, name: 'B' });
    store.getState().setValue(a.id, TODAY, 3);
    store.getState().archiveHabit(a.id, TODAY);
    expect(store.getState().habitOrder).toEqual([b.id]);
    const restarted = boot();
    expect(restarted.getState().habits[a.id].archivedAt).toBe(TODAY);
    expect(restarted.getState().entries[a.id][TODAY].value).toBe(3);
    restarted.getState().unarchiveHabit(a.id);
    expect(restarted.getState().habitOrder).toEqual([b.id, a.id]);
    expect(restarted.getState().habits[a.id].archivedAt).toBeUndefined();
  });

  it('deletes a habit with its entries', () => {
    const store = boot();
    const { id } = store.getState().addHabit(water);
    store.getState().setValue(id, TODAY, 3);
    store.getState().deleteHabit(id);
    const again = boot();
    expect(again.getState().habits[id]).toBeUndefined();
    expect(again.getState().entries[id]).toBeUndefined();
    expect(again.getState().habitOrder).toEqual([]);
  });

  it('persists a new order', () => {
    const store = boot();
    const a = store.getState().addHabit(water);
    const b = store.getState().addHabit({ ...water, name: 'B' });
    store.getState().setOrder([b.id, a.id]);
    expect(boot().getState().habitOrder).toEqual([b.id, a.id]);
    store.getState().move(b.id, 1);
    expect(boot().getState().habitOrder).toEqual([a.id, b.id]);
  });
});

describe('timers', () => {
  const timerDraft: HabitDraft = { ...water, type: 'timer', target: 10, unit: 'min' };

  it('runs across a restart and credits the elapsed time on pause', () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000_000);
    const store = boot();
    const { id } = store.getState().addHabit(timerDraft);
    store.getState().startTimer(id, TODAY);
    expect(boot().getState().entries[id][TODAY].timerStartedAt).toBe(1_000_000); // survives a kill
    now.mockReturnValue(1_000_000 + 125_000);
    store.getState().pauseTimer(id, TODAY);
    expect(store.getState().entries[id][TODAY]).toMatchObject({ value: 125 });
    expect(store.getState().entries[id][TODAY].timerStartedAt).toBeUndefined();
    now.mockRestore();
  });

  it('adds manual minutes and removes the entry when they reach zero', () => {
    const store = boot();
    const { id } = store.getState().addHabit(timerDraft);
    store.getState().addMinutes(id, TODAY, 5);
    expect(store.getState().entries[id][TODAY].value).toBe(300);
    store.getState().addMinutes(id, TODAY, -5);
    expect(store.getState().entries[id][TODAY]).toBeUndefined();
  });
});

describe('streak freeze reward', () => {
  it('grants one per day, up to two, and persists', () => {
    const store = boot();
    expect(store.getState().earnFreeze(TODAY)).toBe(true);
    expect(store.getState().earnFreeze(TODAY)).toBe(false); // same day
    expect(store.getState().earnFreeze('2026-10-09' as DayKey)).toBe(true);
    expect(store.getState().earnFreeze('2026-10-10' as DayKey)).toBe(false); // full
    expect(boot().getState().freezes.count).toBe(2);
  });
});

