import '@/testing/stores';
import React from 'react';
import { mockLastNotificationResponse, mockNotif, mockNotifState, mockRouter } from '@/testing/mocks';
import { cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { sharedStore } from '@shared/storage';
import { addDays, dateKeyFor } from '@/domain/dateKey';
import { completeDailyStreak } from '@/domain/streak';
import { defaultStreak } from '@/domain/defaults';
import { recordDaily } from '@/domain/daily';
import { changeReminderTime, disableReminder, enableReminder, syncReminder, useNotificationResponses } from '@/notifications/reminder';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useDaily, useStreak } from '@/store/stores';

const NOON = new Date(2026, 9, 8, 12, 0);
beforeEach(() => {
  resetApp(NOON);
  jest.useFakeTimers({ now: NOON });
  mockNotif.granted = true;
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

const pending = () => [...mockNotifState.pending.values()].sort((a, b) => String(a.identifier).localeCompare(String(b.identifier), undefined, { numeric: true }));
const bodies = () => pending().map((p) => p.content.body as string);
const turnOn = (hour = 19, minute = 0) => useSettings.getState().update({ reminder: { enabled: true, hour, minute } });

describe('scheduling', () => {
  it('schedules nothing while reminders are off, and nothing without the permission', async () => {
    expect(await syncReminder(NOON)).toBe(0);
    turnOn();
    mockNotif.granted = false;
    expect(await syncReminder(NOON)).toBe(0);
    expect(pending()).toHaveLength(0);
  });

  it('plans 8 one-off notifications on the daily channel, at the chosen time, with a link to the Daily', async () => {
    turnOn(19, 0);
    expect(await syncReminder(NOON)).toBe(8);
    const all = pending();
    expect(all).toHaveLength(8);
    for (const p of all) {
      expect(p.trigger).toMatchObject({ type: 'date', channelId: 'daily' });
      expect((p.trigger.date as Date).getHours()).toBe(19);
      expect(p.content.data).toMatchObject({ url: 'quizora://daily' });
    }
  });

  it('is idempotent: planning again replaces the old plan instead of adding to it', async () => {
    turnOn();
    await syncReminder(NOON);
    await syncReminder(NOON);
    await syncReminder(NOON);
    expect(pending()).toHaveLength(8);
  });

  it('skips today once the Daily is played, and rotates the copy', async () => {
    turnOn();
    useDaily.setState({ value: recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, dateKeyFor(NOON), 7) });
    await syncReminder(NOON);
    expect(pending()).toHaveLength(7);
    expect(new Set(bodies()).size).toBeGreaterThan(2);
  });

  it('says the streak ends at midnight at 20:30 when a streak of 2+ is at stake', async () => {
    turnOn(19, 0);
    let s = defaultStreak();
    for (const i of [3, 2, 1]) s = completeDailyStreak(s, addDays(dateKeyFor(NOON), -i), 1, 0).state;
    useStreak.setState({ value: s });
    await syncReminder(NOON);
    const first = pending()[0];
    expect(first.content.body).toBe('Your 3-day streak ends at midnight.');
    expect([(first.trigger.date as Date).getHours(), (first.trigger.date as Date).getMinutes()]).toEqual([20, 30]);
    expect(pending()).toHaveLength(8);
  });

  it('puts the comeback messages on days 3 and 7', async () => {
    turnOn();
    await syncReminder(NOON);
    const b = bodies();
    expect(b[3]).toBe('Your next round of trivia is waiting.');
    expect(b[7]).toBe('Missed you! Come back for a quick Daily Challenge.');
  });

  it('never plans more than one a day, and stops after day 7', async () => {
    turnOn();
    await syncReminder(NOON);
    const days = pending().map((p) => dateKeyFor(p.trigger.date as Date));
    expect(new Set(days).size).toBe(days.length);
    expect(Math.max(...pending().map((p) => (p.trigger.date as Date).getTime()))).toBeLessThan(NOON.getTime() + 8 * 86_400_000);
  });

  it('reads the clock when it runs, not a date from earlier (a background call days later)', async () => {
    turnOn();
    await syncReminder(NOON);
    const later = new Date(2026, 9, 12, 12, 0);
    await syncReminder(later);
    expect(dateKeyFor(pending()[0].trigger.date as Date)).toBe('2026-10-12');
  });

  it('enableReminder asks the system, turns the setting on and plans; disable cancels everything', async () => {
    mockNotif.granted = false;
    expect(await enableReminder(8, 30)).toBe('enabled');
    expect(useSettings.getState().settings.reminder).toEqual({ enabled: true, hour: 8, minute: 30 });
    expect(pending().length).toBeGreaterThan(0);
    await changeReminderTime(21, 15);
    expect(useSettings.getState().settings.reminder).toMatchObject({ hour: 21, minute: 15 });
    for (const p of pending()) expect((p.trigger.date as Date).getHours()).toBe(21);
    await disableReminder();
    expect(pending()).toHaveLength(0);
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
  });

  it('reports a refused and a permanently blocked permission without turning the reminder on', async () => {
    mockNotif.granted = false;
    mockNotif.answer = false;
    mockNotif.keepAsking = true; // the system would let us ask again
    expect(await enableReminder(19, 0)).toBe('denied');
    mockNotif.canAskAgain = false;
    expect(await enableReminder(19, 0)).toBe('blocked');
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
  });
});

describe('tapping a notification', () => {
  function Probe() {
    useNotificationResponses();
    return null;
  }
  const tap = (id: string, action = 'expo.modules.notifications.actions.DEFAULT') => {
    mockLastNotificationResponse.current = { actionIdentifier: action, notification: { request: { identifier: id, content: { data: { url: 'quizora://daily', dateKey: '2020-01-01' } } } } };
  };

  it('opens the Daily Challenge, once per tap, and ignores the date inside the notification', async () => {
    sharedStore.set('onboarding.completedAt', 1);
    db.set('onboarding.done', true);
    tap('n1');
    const r = await render(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/daily');
    await r.update(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    await cleanup();
    await render(<Probe />); // a relaunch with the same last response is the same tap
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    tap('n2');
    await render(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledTimes(2);
  });

  it('does nothing before onboarding is finished, and for other actions', async () => {
    tap('n3');
    await render(<Probe />);
    expect(mockRouter.push).not.toHaveBeenCalled();
    await cleanup();
    sharedStore.set('onboarding.completedAt', 1);
    db.set('onboarding.done', true);
    tap('n4', 'dismiss');
    await render(<Probe />);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
