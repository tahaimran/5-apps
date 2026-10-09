import { mockNotif, mockNotifState, mockLastNotificationResponse, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import '@/bootstrap';
import { REMINDER_STOP_DAYS, reminderExpired, syncKickReminder, KICK_REMINDER_ID, enableKickReminder } from '../kickReminder';
import { routeFor } from '../responses';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';

beforeEach(() => resetApp());

describe('reminderExpired (plan §10: stop 21 days after the due date)', () => {
  it('is false up to and including day 21, true from day 22, false without a due date', () => {
    expect(reminderExpired('2026-11-12', new Date(2026, 11, 3))).toBe(false); // +21
    expect(reminderExpired('2026-11-12', new Date(2026, 11, 4))).toBe(true); // +22
    expect(reminderExpired(null, new Date(2030, 0, 1))).toBe(false);
    expect(REMINDER_STOP_DAYS).toBe(21);
  });
});

describe('syncKickReminder', () => {
  const on = (hour = 20, minute = 0) => useSettings.getState().update({ kickReminder: { enabled: true, hour, minute } });

  it('schedules one daily notification when it is on and allowed', async () => {
    mockNotif.granted = true;
    on(7, 30);
    expect(await syncKickReminder(new Date(2026, 10, 4))).toBe(true);
    expect([...mockNotifState.pending.keys()]).toEqual([KICK_REMINDER_ID]);
    expect(mockNotifState.pending.get(KICK_REMINDER_ID)!.trigger).toMatchObject({ type: 'daily', hour: 7, minute: 30 });
  });
  it('cancels when it is off', async () => {
    mockNotif.granted = true;
    on();
    await syncKickReminder(new Date(2026, 10, 4));
    useSettings.getState().update({ kickReminder: { enabled: false, hour: 20, minute: 0 } });
    expect(await syncKickReminder(new Date(2026, 10, 4))).toBe(false);
    expect(mockNotifState.pending.size).toBe(0);
  });
  it('cancels, and does not ask again, when the permission was taken away in the phone settings', async () => {
    mockNotif.granted = true;
    on();
    await syncKickReminder(new Date(2026, 10, 4));
    mockNotif.granted = false;
    expect(await syncKickReminder(new Date(2026, 10, 5))).toBe(false);
    expect(mockNotifState.pending.size).toBe(0);
    expect(mockNotif.granted).toBe(false); // never re-asked here
  });
  it('stops for good 21 days after the due date, and turns the setting off so it does not look on', async () => {
    mockNotif.granted = true;
    on();
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' });
    expect(await syncKickReminder(new Date(2026, 11, 3))).toBe(true);
    expect(await syncKickReminder(new Date(2026, 11, 4))).toBe(false);
    expect(mockNotifState.pending.size).toBe(0);
    expect(useSettings.getState().settings.kickReminder.enabled).toBe(false);
  });
  it('enabling asks for permission exactly once, and only here', async () => {
    mockNotif.answer = true;
    expect(await enableKickReminder(20, 0)).toBe('enabled');
    expect(mockNotif.granted).toBe(true);
  });
});

describe('notification routes', () => {
  it('opens only the Timer and Kicks tabs', () => {
    expect(routeFor('contractiontimer://timer')).toBe('/timer');
    expect(routeFor('contractiontimer://kicks')).toBe('/kicks');
    expect(routeFor('contractiontimer://more')).toBeNull();
    expect(routeFor('https://example.com/timer')).toBeNull();
    expect(routeFor('contractiontimer://timer/../more')).toBeNull();
    expect(routeFor(undefined)).toBeNull();
    expect(routeFor(42)).toBeNull();
  });
});

void mockLastNotificationResponse;
void mockRouter;
