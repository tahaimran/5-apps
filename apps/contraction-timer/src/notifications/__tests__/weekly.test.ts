import { mockNotif, mockNotifState } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import '@/bootstrap';
import { setWeeklyCards, syncWeeklyCards, WEEKLY_ID } from '../weekly';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';

const NOW = new Date(2026, 9, 9, 8, 0);
const ids = () => [...mockNotifState.pending.keys()].filter((k) => k.startsWith(WEEKLY_ID));

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate', 'setTimeout'] });
  resetApp(NOW);
  useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' });
});
afterEach(() => jest.useRealTimers());

describe('syncWeeklyCards', () => {
  it('is on by default once a due date is set, and schedules the weeks to come when permission already exists', async () => {
    expect(useSettings.getState().settings.weeklyCardNotif).toBe(true);
    mockNotif.granted = true;
    expect(await syncWeeklyCards(NOW)).toBe(7);
    expect(ids()).toHaveLength(7);
    const first = mockNotifState.pending.get(`${WEEKLY_ID}:0`)!;
    expect(first.content.body).toBe('Week 36: baby is about the size of a head of romaine lettuce 🥬');
    expect(first.trigger).toMatchObject({ type: 'date', channelId: 'weekly' });
  });
  it('writes the plan\'s own example for week 35', async () => {
    mockNotif.granted = true;
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-19' });
    await syncWeeklyCards(NOW);
    expect([...mockNotifState.pending.values()].some((n) => n.content.body === 'Week 35: baby is about the size of a honeydew melon 🍈')).toBe(true);
  });
  it('schedules nothing without permission, and never asks for it', async () => {
    mockNotif.granted = false;
    expect(await syncWeeklyCards(NOW)).toBe(0);
    expect(mockNotif.granted).toBe(false);
  });
  it('schedules nothing without a due date, or when switched off', async () => {
    mockNotif.granted = true;
    useSettings.getState().update({ weeklyCardNotif: false });
    expect(await syncWeeklyCards(NOW)).toBe(0);
    useSettings.getState().update({ weeklyCardNotif: true });
    useProfile.getState().clearDue();
    expect(await syncWeeklyCards(NOW)).toBe(0);
    expect(ids()).toHaveLength(0);
  });
  it('replaces the plan when the due date changes', async () => {
    mockNotif.granted = true;
    await syncWeeklyCards(NOW);
    useProfile.getState().setDue({ mode: 'edd', date: '2026-12-10' });
    await syncWeeklyCards(NOW);
    expect(ids()).toHaveLength(upcomingCount());
  });
  it('turning it on asks for permission; a refusal leaves it off', async () => {
    useSettings.getState().update({ weeklyCardNotif: false });
    mockNotif.answer = false;
    expect(await setWeeklyCards(true)).toBe(false);
    expect(useSettings.getState().settings.weeklyCardNotif).toBe(false);
    mockNotif.answer = true;
    mockNotif.canAskAgain = true;
    expect(await setWeeklyCards(true)).toBe(true);
    expect(ids().length).toBeGreaterThan(0);
    expect(await setWeeklyCards(false)).toBe(false);
    expect(ids()).toHaveLength(0);
  });
});

function upcomingCount() {
  const { upcomingWeeklyCards } = require('@/domain/weekly') as typeof import('@/domain/weekly');
  return upcomingWeeklyCards('2026-12-10', NOW).length;
}
