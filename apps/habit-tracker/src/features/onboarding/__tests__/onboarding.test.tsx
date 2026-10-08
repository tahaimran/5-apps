import type { DayKey } from '@/domain/types';

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
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'View' },
  useSharedValue: (v: number) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  useReducedMotion: () => true,
  withRepeat: (v: unknown) => v,
  withSequence: (...v: unknown[]) => v[0],
  withTiming: (v: unknown) => v,
}));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));
const mockEnsure = jest.fn(async () => true);
jest.mock('@shared/notify', () => ({ ensureNotificationPermission: (...a: unknown[]) => mockEnsure(...(a as [])) }));
jest.mock('@/notifications/scheduler', () => ({ invalidateNotificationPlan: jest.fn() }));

function boot() {
  let mods!: { steps: typeof import('../steps'); finish: typeof import('../finish'); habits: typeof import('@/store/habits'); profile: typeof import('@/store/profile') };
  jest.isolateModules(() => {
    require('@/bootstrap');
    mods = { steps: require('../steps'), finish: require('../finish'), habits: require('@/store/habits'), profile: require('@/store/profile') };
  });
  return mods;
}

beforeEach(() => {
  mockDisk.clear();
  mockEnsure.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 12, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => jest.useRealTimers());

describe('onboarding steps', () => {
  const get = (steps: ReturnType<ReturnType<typeof boot>['steps']['buildSteps']>, key: string) => steps.find((s) => s.key === key)!;

  it('follows the plan: welcome, goals, starters, reminder, permission', () => {
    const { steps } = boot();
    const list = steps.buildSteps(jest.fn());
    expect(list.map((s) => s.key)).toEqual(['welcome', 'goals', 'starters', 'reminder', 'permission']);
    expect(get(list, 'welcome')).toMatchObject({ title: 'Small habits. Big changes.', cta: "Let's start" });
    expect(get(list, 'welcome').secondary?.label).toBe("I'll set up later");
  });
  it('needs one goal before continuing', () => {
    const list = boot().steps.buildSteps(jest.fn());
    const can = get(list, 'goals').canContinue!;
    expect(can({ value: undefined, answers: {} })).toBe(false);
    expect(can({ value: [], answers: {} })).toBe(false);
    expect(can({ value: ['sleep'], answers: {} })).toBe(true);
  });
  it('needs 1 to 3 starter habits', () => {
    const can = get(boot().steps.buildSteps(jest.fn()), 'starters').canContinue!;
    expect(can({ value: [], answers: {} })).toBe(false);
    expect(can({ value: ['a'], answers: {} })).toBe(true);
    expect(can({ value: ['a', 'b', 'c'], answers: {} })).toBe(true);
    expect(can({ value: ['a', 'b', 'c', 'd'], answers: {} })).toBe(false);
  });
  it('hides the permission step when reminders are off', () => {
    const permission = get(boot().steps.buildSteps(jest.fn()), 'permission');
    expect(permission.hidden!({ reminder: { mode: 'none' } })).toBe(true);
    expect(permission.hidden!({ reminder: { mode: 'preset', time: '20:00' } })).toBe(false);
    expect(permission.hidden!({})).toBe(false);
  });
  it('asks for the system permission only on "Allow" (not on "Not now")', async () => {
    const onPermission = jest.fn();
    const permission = get(boot().steps.buildSteps(onPermission), 'permission');
    const finish = jest.fn();
    permission.secondary!.onPress({ finish } as never);
    expect(finish).toHaveBeenCalled();
    expect(mockEnsure).not.toHaveBeenCalled();
    await permission.onContinue!({} as never);
    expect(mockEnsure).toHaveBeenCalledWith(null); // the card is the explanation, no extra dialog
    expect(onPermission).toHaveBeenCalledWith(true);
  });
  it('"No reminders" ends the flow with reminders off', () => {
    const reminder = get(boot().steps.buildSteps(jest.fn()), 'reminder');
    const finish = jest.fn();
    reminder.secondary!.onPress({ finish } as never);
    expect(finish).toHaveBeenCalledWith({ reminder: { mode: 'none' } });
  });
  it('"I\'ll set up later" ends the flow at once', () => {
    const welcome = get(boot().steps.buildSteps(jest.fn()), 'welcome');
    const finish = jest.fn();
    welcome.secondary!.onPress({ finish } as never);
    expect(finish).toHaveBeenCalled();
  });
  it('shows the chosen time in the permission card', () => {
    const { steps } = boot();
    expect(steps.reminderTimeFor({ reminder: { mode: 'preset', time: '13:00' } })).toBe('13:00');
    expect(steps.reminderTimeFor({ starters: ['in-bed-early'] })).toBe('22:30');
    expect(steps.reminderTimeFor({})).toBe('20:00');
  });
});

describe('applyOnboardingAnswers', () => {
  it('creates the chosen habits with their suggested reminder times', () => {
    const { finish, habits, profile } = boot();
    const n = finish.applyOnboardingAnswers({ goals: ['sleep'], starters: ['in-bed-early', 'read'] });
    expect(n).toBe(2);
    const list = habits.useHabits.getState().habitOrder.map((id) => habits.useHabits.getState().habits[id]);
    expect(list.map((h) => h.name)).toEqual(['In bed by 23:30', 'Read']);
    expect(list[0].reminders[0].time).toBe('22:30');
    expect(list[0].createdAt).toBe('2026-10-08' as DayKey);
    expect(profile.useProfile.getState().profile).toMatchObject({ goals: ['sleep'], onboardingDone: true });
  });
  it('applies one reminder time to every habit when chosen', () => {
    const { finish, habits } = boot();
    finish.applyOnboardingAnswers({ starters: ['read', 'journal'], reminder: { mode: 'preset', time: '08:00' } });
    const list = Object.values(habits.useHabits.getState().habits);
    expect(list.every((h) => h.reminders[0].time === '08:00')).toBe(true);
  });
  it('creates habits without reminders when "No reminders" was chosen', () => {
    const { finish, habits } = boot();
    finish.applyOnboardingAnswers({ starters: ['read'], reminder: { mode: 'none' } });
    expect(Object.values(habits.useHabits.getState().habits)[0].reminders).toEqual([]);
  });
  it('skipping with nothing chosen creates no habits but still completes', () => {
    const { finish, habits, profile } = boot();
    expect(finish.applyOnboardingAnswers({})).toBe(0);
    expect(habits.useHabits.getState().habitOrder).toEqual([]);
    expect(profile.useProfile.getState().profile.onboardingDone).toBe(true);
  });
  it('ignores unknown template ids', () => {
    const { finish, habits } = boot();
    expect(finish.applyOnboardingAnswers({ starters: ['nope', 'read'] })).toBe(1);
    expect(habits.useHabits.getState().habitOrder).toHaveLength(1);
  });
});
