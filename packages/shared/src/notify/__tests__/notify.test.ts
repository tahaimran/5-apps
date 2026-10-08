import { Alert, Platform } from 'react-native';

const mockN = {
  perms: { granted: false, canAskAgain: true },
  requestResult: { granted: true },
  scheduled: [] as { identifier: string }[],
  schedule: jest.fn(async (_req: unknown) => 'id'),
  cancel: jest.fn(async (_id: string) => undefined),
  channel: jest.fn(async (_id: string, _c: unknown) => null),
  handler: jest.fn(),
  request: jest.fn(),
};
jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, LOW: 2, HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
  getPermissionsAsync: async () => mockN.perms,
  requestPermissionsAsync: async () => {
    mockN.request();
    return mockN.requestResult;
  },
  setNotificationHandler: (h: unknown) => mockN.handler(h),
  setNotificationChannelAsync: (id: string, c: unknown) => mockN.channel(id, c),
  scheduleNotificationAsync: (r: unknown) => mockN.schedule(r),
  cancelScheduledNotificationAsync: (id: string) => mockN.cancel(id),
  getAllScheduledNotificationsAsync: async () => mockN.scheduled,
}));

import '../../testing/native';

function load() {
  let m!: typeof import('../index');
  jest.isolateModules(() => {
    m = require('../index');
  });
  return m;
}

const withOS = (os: 'android' | 'ios') => jest.replaceProperty(Platform, 'OS', os);

beforeEach(() => {
  jest.clearAllMocks();
  mockN.perms = { granted: false, canAskAgain: true };
  mockN.requestResult = { granted: true };
  mockN.scheduled = [];
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 12, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('initNotifications', () => {
  it('creates the Android channels with their importance, and a foreground handler', async () => {
    withOS('android');
    const n = load();
    await n.initNotifications([
      { id: 'reminders', name: 'Reminders', importance: 3 },
      { id: 'summary', name: 'Summary', importance: 2, description: 'Daily' },
    ]);
    expect(mockN.channel).toHaveBeenCalledWith('reminders', expect.objectContaining({ name: 'Reminders', importance: 3 }));
    expect(mockN.channel).toHaveBeenCalledWith('summary', expect.objectContaining({ importance: 2, description: 'Daily' }));
    expect(mockN.handler).toHaveBeenCalledTimes(1);
  });
  it('defaults to one "reminders" channel with default importance', async () => {
    withOS('android');
    await load().initNotifications();
    expect(mockN.channel).toHaveBeenCalledWith('reminders', expect.objectContaining({ importance: 3 }));
  });
  it('skips channels off Android', async () => {
    withOS('ios');
    await load().initNotifications();
    expect(mockN.channel).not.toHaveBeenCalled();
    expect(mockN.handler).toHaveBeenCalled();
  });
  it('runs only once', async () => {
    withOS('android');
    const n = load();
    await n.initNotifications();
    await n.initNotifications();
    expect(mockN.handler).toHaveBeenCalledTimes(1);
    expect(mockN.channel).toHaveBeenCalledTimes(1);
  });
  it('shows banners in the foreground without sound', async () => {
    await load().initNotifications();
    const handler = mockN.handler.mock.calls[0][0] as { handleNotification: () => Promise<Record<string, boolean>> };
    expect(await handler.handleNotification()).toMatchObject({ shouldShowBanner: true, shouldPlaySound: false });
  });
});

describe('permission', () => {
  it('reports the current state', async () => {
    mockN.perms = { granted: false, canAskAgain: false };
    expect(await load().getNotificationPermission()).toEqual({ granted: false, canAskAgain: false });
  });
  it('is true without asking when already granted', async () => {
    mockN.perms = { granted: true, canAskAgain: true };
    const alert = jest.spyOn(Alert, 'alert');
    expect(await load().ensureNotificationPermission('why')).toBe(true);
    expect(alert).not.toHaveBeenCalled();
    expect(mockN.request).not.toHaveBeenCalled();
  });
  it('does not ask again once the user refused for good', async () => {
    mockN.perms = { granted: false, canAskAgain: false };
    const alert = jest.spyOn(Alert, 'alert');
    expect(await load().ensureNotificationPermission('why')).toBe(false);
    expect(alert).not.toHaveBeenCalled();
    expect(mockN.request).not.toHaveBeenCalled();
  });
  it('explains first, and only then asks the system', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons![1].onPress!());
    expect(await load().ensureNotificationPermission('We remind you')).toBe(true);
    expect(alert).toHaveBeenCalledWith(expect.any(String), 'We remind you', expect.any(Array), expect.any(Object));
    expect(mockN.request).toHaveBeenCalledTimes(1);
  });
  it('does not ask the system when the user says "Not now"', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons![0].onPress!());
    expect(await load().ensureNotificationPermission('why')).toBe(false);
    expect(mockN.request).not.toHaveBeenCalled();
  });
  it('treats dismissing the explanation as "Not now"', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, _b, options) => options!.onDismiss!());
    expect(await load().ensureNotificationPermission('why')).toBe(false);
    expect(mockN.request).not.toHaveBeenCalled();
  });
  it('accepts custom wording', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons![1].onPress!());
    await load().ensureNotificationPermission({ title: 'T', message: 'M', allow: 'Yes', notNow: 'No' });
    expect(alert.mock.calls[0][0]).toBe('T');
    expect(alert.mock.calls[0][2]!.map((b) => b.text)).toEqual(['No', 'Yes']);
  });
  it('returns the system answer', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons![1].onPress!());
    mockN.requestResult = { granted: false };
    expect(await load().ensureNotificationPermission('why')).toBe(false);
  });
  it('with null skips its own explanation (the caller already showed one)', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    expect(await load().ensureNotificationPermission(null)).toBe(true);
    expect(alert).not.toHaveBeenCalled();
    expect(mockN.request).toHaveBeenCalledTimes(1);
  });
});

describe('scheduleDaily', () => {
  it('replaces any earlier reminder with the same id and repeats every day', async () => {
    await load().scheduleDaily('water', 9, 30, { title: 'Water', body: 'Drink' });
    expect(mockN.cancel).toHaveBeenCalledWith('water');
    expect(mockN.schedule).toHaveBeenCalledWith({
      identifier: 'water',
      content: { title: 'Water', body: 'Drink' },
      trigger: { type: 'daily', hour: 9, minute: 30, channelId: 'reminders' },
    });
    expect(mockN.cancel.mock.invocationCallOrder[0]).toBeLessThan(mockN.schedule.mock.invocationCallOrder[0]);
  });
  it('can use another channel', async () => {
    await load().scheduleDaily('x', 8, 0, { title: 'x' }, 'summary');
    expect(mockN.schedule).toHaveBeenCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ channelId: 'summary' }) }));
  });
});

describe('scheduleSeries', () => {
  const at = (h: number) => new Date(2026, 9, 8, h);
  it('schedules each future time with a numbered identifier and returns how many', async () => {
    const n = await load().scheduleSeries('s', [
      { at: at(13), content: { title: 'a' } },
      { at: at(14), content: { title: 'b' } },
    ]);
    expect(n).toBe(2);
    expect(mockN.schedule.mock.calls.map((c) => (c[0] as { identifier: string }).identifier)).toEqual(['s:0', 's:1']);
    expect(mockN.schedule).toHaveBeenCalledWith(expect.objectContaining({ trigger: { type: 'date', date: at(13), channelId: 'reminders' } }));
  });
  it('skips times that have passed but keeps the original numbering', async () => {
    const n = await load().scheduleSeries('s', [
      { at: at(8), content: { title: 'past' } },
      { at: at(12), content: { title: 'now' } },
      { at: at(20), content: { title: 'later' } },
    ]);
    expect(n).toBe(1);
    expect((mockN.schedule.mock.calls[0][0] as { identifier: string }).identifier).toBe('s:2');
  });
  it('replaces the earlier series first, including its numbered entries', async () => {
    mockN.scheduled = [{ identifier: 's:0' }, { identifier: 's:3' }, { identifier: 'other:0' }, { identifier: 'ss:0' }];
    await load().scheduleSeries('s', [{ at: at(20), content: { title: 'x' } }]);
    const cancelled = mockN.cancel.mock.calls.map((c) => c[0]);
    expect(cancelled).toEqual(expect.arrayContaining(['s', 's:0', 's:3']));
    expect(cancelled).not.toContain('other:0');
    expect(cancelled).not.toContain('ss:0');
  });
  it('an empty list just clears the series', async () => {
    mockN.scheduled = [{ identifier: 's:0' }];
    expect(await load().scheduleSeries('s', [])).toBe(0);
    expect(mockN.cancel).toHaveBeenCalledWith('s:0');
    expect(mockN.schedule).not.toHaveBeenCalled();
  });
});

describe('cancel', () => {
  it('cancels the id and every numbered notification of that series', async () => {
    mockN.scheduled = [{ identifier: 'a:1' }, { identifier: 'a:2' }, { identifier: 'b:1' }];
    await load().cancel('a');
    expect(mockN.cancel.mock.calls.map((c) => c[0]).sort()).toEqual(['a', 'a:1', 'a:2']);
  });
  it('does not throw when the id does not exist', async () => {
    mockN.cancel.mockRejectedValueOnce(new Error('missing'));
    await expect(load().cancel('nope')).resolves.toBeUndefined();
  });
});
