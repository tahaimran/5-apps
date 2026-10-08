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

const mockScheduleSeries = jest.fn(async () => 0);
const mockCancel = jest.fn(async () => undefined);
const mockPermission = jest.fn(async () => ({ granted: true, canAskAgain: true }));
jest.mock('@shared/notify', () => ({
  initNotifications: jest.fn(async () => undefined),
  scheduleSeries: (...a: unknown[]) => mockScheduleSeries(...(a as [])),
  cancel: (...a: unknown[]) => mockCancel(...(a as [])),
  getNotificationPermission: () => mockPermission(),
}));
const mockScheduled = jest.fn(async () => [] as { identifier: string }[]);
jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, LOW: 2, HIGH: 4 },
  setNotificationCategoryAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync: () => mockScheduled(),
}));

const draft = (over: Partial<HabitDraft> = {}): HabitDraft => ({
  name: 'Drink water',
  icon: 'cup-water',
  color: '#0EA5E9',
  type: 'boolean',
  target: 1,
  schedule: { kind: 'daily' },
  category: 'health',
  createdAt: '2026-10-01' as DayKey,
  reminderTime: '19:00',
  ...over,
});

function boot() {
  let mods!: { sched: typeof import('../scheduler'); habits: typeof import('@/store/habits'); settings: typeof import('@/store/settings') };
  jest.isolateModules(() => {
    require('@/bootstrap'); // registers the English strings, as index.ts does
    mods = { sched: require('../scheduler'), habits: require('@/store/habits'), settings: require('@/store/settings') };
  });
  return mods;
}

beforeEach(() => {
  mockDisk.clear();
  jest.clearAllMocks();
  mockPermission.mockResolvedValue({ granted: true, canAskAgain: true });
  mockScheduled.mockResolvedValue([]);
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 10, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => jest.useRealTimers());

const callsFor = (id: string) => mockScheduleSeries.mock.calls.filter((c) => (c as unknown[])[0] === id);

describe('rescheduleNotifications', () => {
  it('schedules a habit reminder series with the planned times, channel and deep link', async () => {
    const { sched, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft());
    await sched.rescheduleNotifications();
    const [seriesId, entries, channel] = callsFor(`habit-${id}`)[0] as unknown as [string, { at: Date; content: Record<string, unknown> }[], string];
    expect(seriesId).toBe(`habit-${id}`);
    expect(channel).toBe('reminders');
    expect(entries).toHaveLength(7);
    expect(entries[0].at).toEqual(new Date(2026, 9, 8, 19, 0));
    expect(entries[0].content).toMatchObject({ title: 'Drink water', body: 'Time to check in.', categoryIdentifier: 'habit-done' });
    expect(entries[0].content.data).toMatchObject({ path: `/habit/${id}` });
  });

  it('uses no action button for count habits', async () => {
    const { sched, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft({ type: 'count', target: 8, unit: 'glasses' }));
    await sched.rescheduleNotifications();
    const entries = (callsFor(`habit-${id}`)[0] as unknown as [string, { content: { categoryIdentifier?: string } }[]])[1];
    expect(entries[0].content.categoryIdentifier).toBeUndefined();
  });

  it('plans the summary on its own channel when enabled', async () => {
    const { sched, habits, settings } = boot();
    habits.useHabits.getState().addHabit(draft({ reminderTime: null }));
    settings.useSettings.getState().update({ dailySummary: { enabled: true, time: '21:00' } });
    await sched.rescheduleNotifications();
    const [, entries, channel] = callsFor('summary')[0] as unknown as [string, { content: { body: string } }[], string];
    expect(channel).toBe('summary');
    expect(entries[0].content.body).toBe("You have 1 habit left today. You've got this.");
  });

  it('clears every series and plans nothing without permission', async () => {
    mockPermission.mockResolvedValue({ granted: false, canAskAgain: false });
    const { sched, habits } = boot();
    habits.useHabits.getState().addHabit(draft());
    await sched.rescheduleNotifications();
    expect(mockScheduleSeries.mock.calls.length).toBeGreaterThan(0);
    for (const call of mockScheduleSeries.mock.calls) expect((call as unknown as [string, unknown[]])[1]).toEqual([]);
  });

  it('skips the work when nothing changed', async () => {
    const { sched, habits } = boot();
    habits.useHabits.getState().addHabit(draft());
    await sched.rescheduleNotifications();
    const first = mockScheduleSeries.mock.calls.length;
    await sched.rescheduleNotifications();
    expect(mockScheduleSeries.mock.calls.length).toBe(first);
    sched.invalidateNotificationPlan();
    await sched.rescheduleNotifications();
    expect(mockScheduleSeries.mock.calls.length).toBe(first * 2);
  });

  it('re-plans after a check-in (the reminder for today goes away)', async () => {
    const { sched, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft());
    await sched.rescheduleNotifications();
    habits.useHabits.getState().setValue(id, '2026-10-08' as DayKey, 1);
    await sched.rescheduleNotifications();
    const latest = callsFor(`habit-${id}`).at(-1) as unknown as [string, { at: Date }[]];
    expect(latest[1]).toHaveLength(6);
    expect(latest[1][0].at).toEqual(new Date(2026, 9, 9, 19, 0));
  });

  it('cancels series of habits that were deleted', async () => {
    const { sched, habits } = boot();
    mockScheduled.mockResolvedValue([{ identifier: 'habit-gone:0' }, { identifier: 'summary:1' }]);
    habits.useHabits.getState().addHabit(draft());
    await sched.rescheduleNotifications();
    expect(mockCancel).toHaveBeenCalledWith('habit-gone');
    expect(mockCancel).not.toHaveBeenCalledWith('summary');
  });

  it('runs overlapping calls one after another', async () => {
    const { sched, habits } = boot();
    habits.useHabits.getState().addHabit(draft());
    await Promise.all([sched.rescheduleNotifications(), sched.rescheduleNotifications(), sched.rescheduleNotifications()]);
    // Three triggers, one real run (the others see an unchanged plan).
    expect(callsFor('summary')).toHaveLength(1);
  });
});
