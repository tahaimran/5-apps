import '@/testing/mocks';
import { mockLastNotificationResponse as mockLast, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import '@/bootstrap';
import type { DayKey } from '@/domain/types';
import { useHabits } from '@/store/habits';
import { useToday } from '@/store/today';

const mockRefresh = jest.fn(async () => undefined);
jest.mock('@/widget/sync', () => ({ refreshWidget: () => mockRefresh() }));

import { useNotificationResponses } from '../sync';

const TODAY = '2026-10-08' as DayKey;
let seq = 0;
const response = (actionIdentifier: string, data: Record<string, unknown>, id = `n${++seq}`) => ({
  actionIdentifier,
  notification: { request: { identifier: id, content: { data } } },
});

function Probe() {
  useNotificationResponses();
  return null;
}

const draft = {
  name: 'Read', icon: 'star-outline', color: '#7C5CFF', type: 'boolean' as const, target: 1,
  schedule: { kind: 'daily' as const }, category: 'other', createdAt: TODAY, reminderTime: null,
};

beforeEach(() => {
  resetApp();
  useToday.setState({ today: TODAY });
  mockLast.current = null;
  mockRouter.push.mockClear();
  mockRefresh.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 9, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('notification responses', () => {
  it('a tap opens the habit', async () => {
    mockLast.current = response('default', { path: '/habit/abc' });
    await render(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledWith('/habit/abc');
  });

  it('opens Today when the notification has no path', async () => {
    mockLast.current = response('default', {});
    await render(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('"Done ✓" checks today off without opening the app, and redraws the widget', async () => {
    const { id } = useHabits.getState().addHabit(draft);
    mockLast.current = response('done', { habitId: id, day: TODAY });
    await render(<Probe />);
    expect(useHabits.getState().entries[id][TODAY].value).toBe(1);
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('"Done ✓" from yesterday\'s reminder does not tick off today', async () => {
    const { id } = useHabits.getState().addHabit(draft);
    mockLast.current = response('done', { habitId: id, day: '2026-10-07' });
    await render(<Probe />);
    expect(useHabits.getState().entries[id][TODAY]).toBeUndefined();
  });

  it('ignores "Done ✓" for a habit that was deleted, or one that is not yes/no', async () => {
    const count = useHabits.getState().addHabit({ ...draft, type: 'count', target: 8 });
    mockLast.current = response('done', { habitId: count.id, day: TODAY });
    await render(<Probe />);
    expect(useHabits.getState().entries[count.id][TODAY]).toBeUndefined();
    mockLast.current = response('done', { habitId: 'gone', day: TODAY });
    await render(<Probe />);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('handles the same response only once', async () => {
    const { id } = useHabits.getState().addHabit(draft);
    mockLast.current = response('done', { habitId: id, day: TODAY }, 'same');
    await render(<Probe />);
    useHabits.getState().setValue(id, TODAY, 0); // user undoes it
    await render(<Probe />);
    expect(useHabits.getState().entries[id][TODAY]).toBeUndefined();
  });
});
