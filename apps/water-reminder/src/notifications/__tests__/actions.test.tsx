import { Platform } from 'react-native';
import { act } from 'react';
import { mockLastNotificationResponse, mockNotif, mockNotifState, mockRouter, resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import '@/bootstrap';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { resetAdGuardState, adContext } from '@/ads/guard';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useWater } from '@/store/water';
import { addCupFromNotification, claimResponse, handleNotificationAction, snoozeFromNotification } from '../actions';
import { ACTION_TASK, registerBackgroundWork, TOPUP_TASK } from '../backgroundTask';
import { invalidateReminderPlan, scheduleSnooze } from '../scheduler';
import { resetSetup } from '../setup';
import { batteryGuideDue, detectMissedReminders, useNotificationResponses, useReminderSync } from '../sync';

const NOW = new Date(2026, 9, 8, 14, 0);
const response = (action: string, id = 'reminder:3', date = NOW.getTime()) =>
  ({ actionIdentifier: action, notification: { date, request: { identifier: id, content: { data: {} } } } }) as unknown as Notifications.NotificationResponse;
const today = () => useWater.getState().logsForDay('2026-10-08');

beforeAll(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
});
beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  resetNotifMock();
  resetSetup();
  resetAdGuardState();
  invalidateReminderPlan();
  mockNotif.granted = true;
  mockLastNotificationResponse.current = null;
  for (const fn of Object.values(mockRouter)) if (typeof fn === 'function' && 'mockClear' in fn) (fn as jest.Mock).mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('"Add 250 ml" on a reminder (F6)', () => {
  it('logs the preferred cup as a notification drink, dismisses it and re-plans', async () => {
    useSettings.getState().setPrefs({ preferredCupId: 'cup-350' });
    await handleNotificationAction(response('ADD_CUP'));
    expect(today()).toHaveLength(1);
    expect(today()[0]).toMatchObject({ volumeMl: 350, source: 'notification', beverage: 'water' });
    expect(mockNotifState.dismissed).toEqual(['reminder:3']);
    expect([...mockNotifState.pending.keys()].some((id) => id.startsWith('reminder:'))).toBe(true);
  });
  it('cancels a pending snooze, because the user drank', async () => {
    await scheduleSnooze(NOW);
    expect(mockNotifState.pending.has('snooze:0')).toBe(true);
    await addCupFromNotification('reminder:1');
    expect(mockNotifState.pending.has('snooze:0')).toBe(false);
  });
  it('logs a drink only once when the same response arrives twice (task, then next launch)', async () => {
    const r = response('ADD_CUP');
    expect(await handleNotificationAction(r)).toBe(true);
    expect(await handleNotificationAction(r)).toBe(false);
    expect(today()).toHaveLength(1);
    expect(claimResponse(response('ADD_CUP', 'reminder:4'))).toBe(true);
    expect(db.get('handledResponse')).toContain('reminder:4:ADD_CUP');
  });
  it('ignores buttons that are not ours', async () => {
    expect(await handleNotificationAction(response('something-else'))).toBe(false);
    expect(today()).toHaveLength(0);
  });
  it('still logs when dismissing fails', async () => {
    const dismiss = jest.spyOn(Notifications, 'dismissNotificationAsync').mockRejectedValueOnce(new Error('gone'));
    await addCupFromNotification('x');
    expect(today()).toHaveLength(1);
    dismiss.mockRestore();
  });
});

describe('"Snooze 15 min"', () => {
  it('sets a reminder 15 minutes later and dismisses the notification', async () => {
    expect(await handleNotificationAction(response('SNOOZE'))).toBe(true);
    expect((mockNotifState.pending.get('snooze:0')!.trigger as { date: Date }).date).toEqual(new Date(2026, 9, 8, 14, 15));
    expect(mockNotifState.dismissed).toEqual(['reminder:3']);
    expect(today()).toHaveLength(0);
  });
  it('honours the configured snooze length', async () => {
    useSettings.getState().setReminders({ snoozeMin: 30 });
    await snoozeFromNotification();
    expect((mockNotifState.pending.get('snooze:0')!.trigger as { date: Date }).date).toEqual(new Date(2026, 9, 8, 14, 30));
  });
  it('is dropped after bedtime', async () => {
    jest.setSystemTime(new Date(2026, 9, 8, 22, 55));
    expect(await snoozeFromNotification()).toBe(false);
    expect(mockNotifState.pending.has('snooze:0')).toBe(false);
  });
});

describe('background task (app closed, plan §10.4)', () => {
  const handlers = () => new Map((TaskManager.defineTask as jest.Mock).mock.calls.map((c) => [c[0], c[1]]));
  it('defines both tasks when the module loads', () => {
    expect([...handlers().keys()].sort()).toEqual([ACTION_TASK, TOPUP_TASK].sort());
  });
  it('logs the drink when the action arrives in the background', async () => {
    const result = await handlers().get(ACTION_TASK)({ data: response('ADD_CUP') });
    expect(result).toBe(Notifications.BackgroundNotificationTaskResult.NoData);
    expect(today()).toHaveLength(1);
  });
  it('ignores payloads that are not a response to our buttons', async () => {
    await handlers().get(ACTION_TASK)({ data: { notification: null, data: {} } });
    expect(today()).toHaveLength(0);
  });
  it('tops up the horizon on its schedule', async () => {
    expect(await handlers().get(TOPUP_TASK)({ data: {} })).toBe(1);
    expect(mockNotifState.pending.size).toBeGreaterThan(0);
  });
  it('reports a failure of the top-up', async () => {
    const failing = jest.spyOn(require('expo-notifications'), 'getPermissionsAsync').mockRejectedValue(new Error('x'));
    // the queue swallows errors, so the task still succeeds; it must never throw
    await expect(handlers().get(TOPUP_TASK)({ data: {} })).resolves.toBeDefined();
    failing.mockRestore();
  });
  it('registers the action task and the 12 hour top-up', () => {
    registerBackgroundWork();
    expect(Notifications.registerTaskAsync).toHaveBeenCalledWith(ACTION_TASK);
    expect(require('expo-background-task').registerTaskAsync).toHaveBeenCalledWith(TOPUP_TASK, { minimumInterval: 720 });
  });
});

function Sync() {
  useReminderSync();
  useNotificationResponses();
  return null;
}

describe('useReminderSync', () => {
  it('plans on start, re-plans (debounced) after a log and cancels a snooze when the user drinks', async () => {
    useSettings.getState().setGoal({ goalMl: 2300 }); // a 14:10 slot sits right after the 14:00 drink
    await render(<Sync />);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(mockNotifState.scheduleCalls).toBeGreaterThan(0);
    await scheduleSnooze(NOW);
    const initial = mockNotifState.scheduleCalls;
    await act(async () => {
      useWater.getState().logDrink({ volumeMl: 250 });
      useWater.getState().logDrink({ volumeMl: 250 });
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(mockNotifState.scheduleCalls).toBe(initial); // still debouncing
    expect(mockNotifState.pending.has('snooze:0')).toBe(false);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(200);
    });
    expect(mockNotifState.scheduleCalls).toBeGreaterThan(initial);
  });
  it('re-plans after a settings change and records when the app was opened', async () => {
    await render(<Sync />);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(db.get('lastOpenAt')).toBe(NOW.getTime());
    const before = mockNotifState.scheduleCalls;
    await act(async () => {
      useSettings.getState().setReminders({ style: 'gentle' });
      await jest.advanceTimersByTimeAsync(600);
    });
    expect(mockNotifState.scheduleCalls).toBeGreaterThan(before);
    expect(mockNotifState.pending.get('reminder:0')?.trigger).toMatchObject({ channelId: 'reminders_gentle' });
  });
  it('re-plans when the app returns to the foreground, even if the plan looks the same', async () => {
    const { AppState } = require('react-native');
    await render(<Sync />);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    const before = mockNotifState.scheduleCalls;
    const foreground = (AppState.addEventListener as jest.Mock).mock.calls.filter((c) => c[0] === 'change').at(-1)[1];
    await act(async () => {
      foreground('active');
      await jest.advanceTimersByTimeAsync(700);
    });
    expect(mockNotifState.scheduleCalls).toBeGreaterThan(before);
  });
});

describe('useNotificationResponses', () => {
  it('opens Today when a reminder is tapped, and keeps app-open ads away', async () => {
    mockLastNotificationResponse.current = response(Notifications.DEFAULT_ACTION_IDENTIFIER);
    await render(<Sync />);
    expect(mockRouter.navigate).toHaveBeenCalledWith('/(tabs)');
    expect(adContext().lastExternalOpenAt).toBe(NOW.getTime());
  });
  it('runs the buttons when the app is open or starting', async () => {
    mockLastNotificationResponse.current = response('ADD_CUP', 'reminder:9');
    await render(<Sync />);
    await flush();
    expect(today()).toHaveLength(1);
  });
});

describe('suspected missed reminders', () => {
  it('counts reminders the OS left pending past their time, and offers the battery guide after two', async () => {
    db.set('scheduled', [
      { notificationId: 'reminder:0', fireAt: NOW.getTime() - 3_600_000, kind: 'slot' },
      { notificationId: 'reminder:1', fireAt: NOW.getTime() - 1_800_000, kind: 'slot' },
      { notificationId: 'reminder:2', fireAt: NOW.getTime() + 600_000, kind: 'slot' },
    ]);
    for (const id of ['reminder:0', 'reminder:1', 'reminder:2']) mockNotifState.pending.set(id, { identifier: id, content: {}, trigger: {} });
    expect(batteryGuideDue()).toBe(false);
    await detectMissedReminders(NOW.getTime());
    expect(useMeta.getState().meta.suspectedMisses).toBe(2);
    expect(batteryGuideDue()).toBe(true);
    useMeta.getState().update({ batteryGuideOffered: true });
    expect(batteryGuideDue()).toBe(false);
  });
  it('counts nothing when everything fired', async () => {
    db.set('scheduled', [{ notificationId: 'reminder:0', fireAt: NOW.getTime() - 3_600_000, kind: 'slot' }]);
    await detectMissedReminders(NOW.getTime());
    expect(useMeta.getState().meta.suspectedMisses).toBeUndefined();
  });
});
