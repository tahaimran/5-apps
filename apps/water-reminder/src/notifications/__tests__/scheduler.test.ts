import { Platform } from 'react-native';
import { mockNotif, mockNotifState, resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import '@/bootstrap';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { cancelSnooze, invalidateReminderPlan, rescheduleReminders, scheduleSnooze } from '../scheduler';
import { registerCategory, resetSetup, setupChannels } from '../setup';

const NOW = new Date(2026, 9, 8, 6, 0);
const pendingIds = () => [...mockNotifState.pending.keys()];
const slots = () => pendingIds().filter((id) => id.startsWith('reminder:'));
const fireTimes = () => slots().map((id) => (mockNotifState.pending.get(id)!.trigger as { date: Date }).date);

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  resetNotifMock();
  resetSetup();
  invalidateReminderPlan();
  mockNotif.granted = true;
  useSettings.getState().setGoal({ goalMl: 2300 }); // 10 reminders a day with a 250 ml cup
});
afterEach(() => jest.useRealTimers());
beforeAll(() => {
  jest.replaceProperty(Platform, 'OS', 'android'); // channels only exist on Android
});
afterAll(() => jest.restoreAllMocks());

describe('channels and action buttons (plan §10.1)', () => {
  it('creates the loud and the gentle channel', async () => {
    await setupChannels();
    expect(mockNotifState.channels.get('reminders')).toMatchObject({ name: 'Water reminders', importance: 4, sound: 'drop.wav', vibrationPattern: [0, 120, 80, 120], lockscreenVisibility: 1 });
    expect(mockNotifState.channels.get('reminders_gentle')).toMatchObject({ name: 'Gentle reminders', importance: 2, sound: null });
  });
  it('labels the buttons with the preferred cup and the snooze time, and updates them when those change', async () => {
    await registerCategory();
    expect(mockNotifState.categories.get('WATER_REMINDER')?.map((a) => [a.identifier, a.buttonTitle])).toEqual([
      ['ADD_CUP', 'Add 250 ml'],
      ['SNOOZE', 'Snooze 15 min'],
    ]);
    useSettings.getState().setPrefs({ preferredCupId: 'cup-500' });
    useSettings.getState().setReminders({ snoozeMin: 30 });
    await registerCategory();
    expect(mockNotifState.categories.get('WATER_REMINDER')?.map((a) => a.buttonTitle)).toEqual(['Add 500 ml', 'Snooze 30 min']);
    useSettings.getState().setGoal({ unit: 'floz' });
    await registerCategory();
    expect(mockNotifState.categories.get('WATER_REMINDER')?.[0].buttonTitle).toBe('Add 16.9 fl oz');
  });
});

describe('rescheduleReminders (F4)', () => {
  it('schedules 10 one-off reminders a day for 3 days, none outside wake + 30 / bed - 30', async () => {
    await rescheduleReminders();
    expect(slots()).toHaveLength(30);
    const times = fireTimes();
    expect(times[0]).toEqual(new Date(2026, 9, 8, 7, 30));
    for (const t of times) {
      const minute = t.getHours() * 60 + t.getMinutes();
      expect(minute).toBeGreaterThanOrEqual(450);
      expect(minute).toBeLessThanOrEqual(1350);
    }
    expect(mockNotifState.pending.get('reminder:0')?.trigger).toMatchObject({ type: 'date', channelId: 'reminders' });
  });
  it('gives each reminder a friendly line, the action buttons, and ends with the soft "misses you" message', async () => {
    await rescheduleReminders();
    const first = mockNotifState.pending.get('reminder:0')!;
    expect(first.content).toMatchObject({ title: '💧 Time for a sip!', categoryIdentifier: 'WATER_REMINDER' });
    expect(String(first.content.body)).toMatch(/\w/);
    const last = mockNotifState.pending.get('reminder:29')!;
    expect(last.content).toMatchObject({ title: '🌱 Your plant misses you' });
    expect(last.content.categoryIdentifier).toBeUndefined();
  });
  it('uses the silent channel for the gentle style', async () => {
    useSettings.getState().setReminders({ style: 'gentle' });
    await rescheduleReminders();
    expect(mockNotifState.pending.get('reminder:0')?.trigger).toMatchObject({ channelId: 'reminders_gentle' });
  });
  it('keeps the ids of what is pending in water.scheduled', async () => {
    await rescheduleReminders();
    const scheduled = db.get('scheduled')!;
    expect(scheduled).toHaveLength(30);
    expect(scheduled[0]).toEqual({ notificationId: 'reminder:0', fireAt: new Date(2026, 9, 8, 7, 30).getTime(), kind: 'slot' });
  });
  it('does nothing when the plan has not changed, and again after it is invalidated', async () => {
    await rescheduleReminders();
    const calls = mockNotifState.scheduleCalls;
    await rescheduleReminders();
    expect(mockNotifState.scheduleCalls).toBe(calls);
    invalidateReminderPlan();
    await rescheduleReminders();
    expect(mockNotifState.scheduleCalls).toBe(calls * 2);
  });
  it('auto-skips the reminder right after a drink (F5), only that instance', async () => {
    jest.setSystemTime(new Date(2026, 9, 8, 9, 0));
    useWater.getState().logDrink({ volumeMl: 250 });
    await rescheduleReminders();
    const times = fireTimes().map((d) => d.getTime());
    expect(times).not.toContain(new Date(2026, 9, 8, 9, 10).getTime());
    expect(times).toContain(new Date(2026, 9, 8, 10, 50).getTime());
    expect(times).toContain(new Date(2026, 9, 9, 9, 10).getTime());
  });
  it('cancels the rest of today when the goal is reached', async () => {
    jest.setSystemTime(new Date(2026, 9, 8, 12, 0));
    useWater.getState().logDrink({ volumeMl: 2300 });
    await rescheduleReminders();
    expect(fireTimes().every((d) => d.getDate() !== 8)).toBe(true);
    expect(fireTimes()[0]).toEqual(new Date(2026, 9, 9, 7, 30));
  });
  it('re-plans after undo, bringing the reminders back', async () => {
    jest.setSystemTime(new Date(2026, 9, 8, 12, 0));
    const { entry } = useWater.getState().logDrink({ volumeMl: 2300 });
    await rescheduleReminders();
    useWater.getState().deleteEntry(entry.id);
    await rescheduleReminders();
    expect(fireTimes().some((d) => d.getDate() === 8)).toBe(true);
  });
  it('drops everything when the permission is revoked and schedules nothing', async () => {
    await rescheduleReminders();
    mockNotif.granted = false;
    await rescheduleReminders();
    expect(slots()).toHaveLength(0);
    expect(db.get('scheduled')).toEqual([]);
  });
  it('plans nothing when reminders are switched off', async () => {
    useSettings.getState().setReminders({ enabled: false });
    await rescheduleReminders();
    expect(slots()).toHaveLength(0);
  });
  it('follows a changed wake time', async () => {
    useSettings.getState().setReminders({ wakeMin: 9 * 60 });
    useToday.getState().refresh();
    await rescheduleReminders();
    expect(fireTimes()[0]).toEqual(new Date(2026, 9, 8, 9, 30));
  });
  it('replaces the old series instead of piling up', async () => {
    await rescheduleReminders();
    useSettings.getState().setGoal({ goalMl: 3500 });
    await rescheduleReminders();
    expect(slots()).toHaveLength(42); // 14 a day
  });
  it('survives a failing notification service', async () => {
    mockNotif.granted = true;
    const failing = jest.spyOn(require('expo-notifications'), 'scheduleNotificationAsync').mockRejectedValueOnce(new Error('boom'));
    await expect(rescheduleReminders()).resolves.toBeUndefined();
    failing.mockRestore();
  });
});

describe('snooze (plan §8.3)', () => {
  it('schedules one reminder 15 minutes later, replacing an earlier snooze', async () => {
    jest.setSystemTime(new Date(2026, 9, 8, 14, 0));
    expect(await scheduleSnooze(new Date())).toEqual(new Date(2026, 9, 8, 14, 15));
    jest.setSystemTime(new Date(2026, 9, 8, 14, 5));
    await scheduleSnooze(new Date());
    const ids = pendingIds().filter((id) => id.startsWith('snooze'));
    expect(ids).toEqual(['snooze:0']);
    expect((mockNotifState.pending.get('snooze:0')!.trigger as { date: Date }).date).toEqual(new Date(2026, 9, 8, 14, 20));
    expect(db.get('scheduled')?.filter((s) => s.kind === 'snooze')).toHaveLength(1);
  });
  it('is dropped when it would land after bedtime', async () => {
    jest.setSystemTime(new Date(2026, 9, 8, 22, 55));
    await scheduleSnooze(new Date());
    expect(await scheduleSnooze(new Date())).toBeNull();
    expect(pendingIds().some((id) => id.startsWith('snooze'))).toBe(false);
  });
  it('survives a re-plan, and is cancelled by a drink or the goal', async () => {
    jest.setSystemTime(new Date(2026, 9, 8, 14, 0));
    await scheduleSnooze(new Date());
    await rescheduleReminders();
    expect(pendingIds()).toContain('snooze:0');
    await cancelSnooze();
    expect(pendingIds()).not.toContain('snooze:0');
    await scheduleSnooze(new Date());
    useWater.getState().logDrink({ volumeMl: 2300 });
    invalidateReminderPlan();
    await rescheduleReminders();
    expect(pendingIds()).not.toContain('snooze:0');
  });
});
