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
jest.mock('react-native-android-widget', () => ({
  FlexWidget: () => null,
  TextWidget: () => null,
  requestWidgetUpdate: jest.fn(),
}));
const mockReschedule = jest.fn(() => Promise.resolve());
jest.mock('@/notifications/scheduler', () => ({ rescheduleNotifications: () => mockReschedule() }));

const TODAY = '2026-10-08' as DayKey;

const draft = (over: Partial<HabitDraft>): HabitDraft => ({
  name: 'Habit',
  icon: 'star-outline',
  color: '#7C5CFF',
  type: 'boolean',
  target: 1,
  schedule: { kind: 'daily' },
  category: 'other',
  createdAt: '2026-10-01' as DayKey,
  reminderTime: null,
  ...over,
});

function boot() {
  let mods!: { handler: typeof import('../widgetTaskHandler'); habits: typeof import('@/store/habits') };
  jest.isolateModules(() => {
    mods = { handler: require('../widgetTaskHandler'), habits: require('@/store/habits') };
  });
  return mods;
}

const props = (over: Record<string, unknown>) => {
  const renderWidget = jest.fn();
  return {
    renderWidget,
    value: {
      widgetInfo: { widgetName: 'TodayWidget', widgetId: 1, height: 200, width: 300, screenInfo: {} },
      widgetAction: 'WIDGET_UPDATE',
      renderWidget,
      ...over,
    } as never,
  };
};

beforeEach(() => {
  mockDisk.clear();
  mockReschedule.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 12, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => jest.useRealTimers());

describe('widget task handler', () => {
  it('a tap on a yes/no row checks the habit in the shared store', async () => {
    const { handler, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft({}));
    const { value, renderWidget } = props({ widgetAction: 'WIDGET_CLICK', clickAction: 'TOGGLE', clickActionData: { id, day: TODAY } });
    await handler.widgetTaskHandler(value);
    expect(habits.useHabits.getState().entries[id][TODAY].value).toBe(1);
    expect(renderWidget).toHaveBeenCalledTimes(1);
  });

  it('a second tap undoes it', async () => {
    const { handler, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft({}));
    const tap = () => handler.widgetTaskHandler(props({ widgetAction: 'WIDGET_CLICK', clickAction: 'TOGGLE', clickActionData: { id, day: TODAY } }).value);
    await tap();
    await tap();
    expect(habits.useHabits.getState().entries[id][TODAY]).toBeUndefined();
  });

  it('a tap on a count row adds one', async () => {
    const { handler, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft({ type: 'count', target: 8, unit: 'glasses' }));
    const tap = () => handler.widgetTaskHandler(props({ widgetAction: 'WIDGET_CLICK', clickAction: 'INCREMENT', clickActionData: { id, day: TODAY } }).value);
    await tap();
    await tap();
    expect(habits.useHabits.getState().entries[id][TODAY].value).toBe(2);
  });

  it('persists the tap so the app sees it after a restart', async () => {
    const { handler, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft({}));
    await handler.widgetTaskHandler(props({ widgetAction: 'WIDGET_CLICK', clickAction: 'TOGGLE', clickActionData: { id, day: TODAY } }).value);
    expect(boot().habits.useHabits.getState().entries[id][TODAY].value).toBe(1);
  });

  it('ignores a tap from a widget drawn on a previous day', async () => {
    const { handler, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft({}));
    await handler.widgetTaskHandler(props({ widgetAction: 'WIDGET_CLICK', clickAction: 'TOGGLE', clickActionData: { id, day: '2026-10-07' } }).value);
    expect(habits.useHabits.getState().entries[id]['2026-10-08' as DayKey]).toBeUndefined();
    expect(habits.useHabits.getState().entries[id]['2026-10-07' as DayKey]).toBeUndefined();
  });

  it('ignores unknown habits and timer taps', async () => {
    const { handler, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft({ type: 'timer', target: 10 }));
    await handler.widgetTaskHandler(props({ widgetAction: 'WIDGET_CLICK', clickAction: 'TOGGLE', clickActionData: { id, day: TODAY } }).value);
    await handler.widgetTaskHandler(props({ widgetAction: 'WIDGET_CLICK', clickAction: 'TOGGLE', clickActionData: { id: 'nope', day: TODAY } }).value);
    expect(habits.useHabits.getState().entries[id]).toEqual({});
  });

  it('draws on add, update and resize, writes the snapshot and re-plans notifications', async () => {
    const { handler, habits } = boot();
    habits.useHabits.getState().addHabit(draft({}));
    for (const widgetAction of ['WIDGET_ADDED', 'WIDGET_UPDATE', 'WIDGET_RESIZED']) {
      const { value, renderWidget } = props({ widgetAction });
      await handler.widgetTaskHandler(value);
      expect(renderWidget).toHaveBeenCalledTimes(1);
    }
    expect(mockReschedule).toHaveBeenCalledTimes(3);
    const snap = JSON.parse(String(mockDisk.get('habit-tracker')!.get('widget:snapshot')));
    expect(snap).toMatchObject({ day: TODAY, total: 1, doneCount: 0 });
  });

  it('does not draw when the widget is deleted', async () => {
    const { handler } = boot();
    const { value, renderWidget } = props({ widgetAction: 'WIDGET_DELETED' });
    await handler.widgetTaskHandler(value);
    expect(renderWidget).not.toHaveBeenCalled();
  });
});
