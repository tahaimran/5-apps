import type { DayKey } from '@/domain/types';
import type { HabitDraft } from '@/domain/validate';

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
const mockRequestUpdate = jest.fn(async () => undefined);
jest.mock('react-native-android-widget', () => ({
  FlexWidget: () => null,
  TextWidget: () => null,
  requestWidgetUpdate: (...a: unknown[]) => mockRequestUpdate(...(a as [])),
}));

const draft: HabitDraft = {
  name: 'Read',
  icon: 'book-open-variant',
  color: '#F97316',
  type: 'boolean',
  target: 1,
  schedule: { kind: 'daily' },
  category: 'learning',
  createdAt: '2026-10-01' as DayKey,
  reminderTime: null,
};

beforeEach(() => {
  mockDisk.clear();
  mockRequestUpdate.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 12, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => jest.useRealTimers());

describe('app → widget sync', () => {
  it('redraws the widget within 1 second of a check-in in the app', async () => {
    let habits!: typeof import('@/store/habits');
    let sync!: typeof import('../sync');
    jest.isolateModules(() => {
      habits = require('@/store/habits');
      sync = require('../sync');
    });
    const { id } = habits.useHabits.getState().addHabit(draft);
    const stop = sync.startWidgetSync();
    await jest.advanceTimersByTimeAsync(200);
    mockRequestUpdate.mockClear();

    habits.useHabits.getState().setValue(id, '2026-10-08' as DayKey, 1);
    await jest.advanceTimersByTimeAsync(300); // debounce is 150 ms
    expect(mockRequestUpdate).toHaveBeenCalled();

    const snap = JSON.parse(String(mockDisk.get('habit-tracker')!.get('widget:snapshot')));
    expect(snap).toMatchObject({ doneCount: 1, total: 1 });
    stop();
  });

  it('coalesces a burst of changes into one redraw', async () => {
    let habits!: typeof import('@/store/habits');
    let sync!: typeof import('../sync');
    jest.isolateModules(() => {
      habits = require('@/store/habits');
      sync = require('../sync');
    });
    const { id } = habits.useHabits.getState().addHabit(draft);
    const stop = sync.startWidgetSync();
    await jest.advanceTimersByTimeAsync(200);
    mockRequestUpdate.mockClear();
    for (let i = 1; i <= 5; i++) habits.useHabits.getState().setValue(id, '2026-10-08' as DayKey, i % 2);
    await jest.advanceTimersByTimeAsync(300);
    expect(mockRequestUpdate).toHaveBeenCalledTimes(1);
    stop();
  });
});
