import { mockNotif, mockNotifState } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { NOW, MINUTE, SECOND, made, sessionOf } from '@/testing/fixtures';
import { Platform } from 'react-native';
import '@/bootstrap';
import { IDLE_PROMPT_MS } from '@/domain/session';
import { installSessionNotifier, sessionOpenDueAt, SESSION_OPEN_ID } from '../sessionOpen';
import { useSessions } from '@/store/sessions';

const flushAsync = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};
const scheduled = () => [...mockNotifState.pending.keys()].filter((k) => k.startsWith(SESSION_OPEN_ID));

let off: () => void;
beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate', 'setTimeout'] });
  resetApp();
  off = installSessionNotifier();
});
afterEach(() => {
  off();
  jest.useRealTimers();
});

describe('sessionOpenDueAt', () => {
  it('is 2 hours after the last tap, or after "Keep"', () => {
    const s = sessionOf([made(NOW, 10 * MINUTE, 60 * SECOND)]);
    expect(sessionOpenDueAt(s)).toBe(s.lastActivityAt + IDLE_PROMPT_MS);
    expect(sessionOpenDueAt({ ...s, snoozedAt: s.lastActivityAt + IDLE_PROMPT_MS })).toBe(s.lastActivityAt + 2 * IDLE_PROMPT_MS);
  });
  it('is null while a contraction runs and with no session', () => {
    expect(sessionOpenDueAt(sessionOf([{ id: 'a', startedAt: NOW, endedAt: null }]))).toBeNull();
    expect(sessionOpenDueAt(null)).toBeNull();
  });
});

describe('the "session left open" note (plan §10)', () => {
  it('is scheduled when a contraction stops, replaced by the next stop, and cancelled by the next start', async () => {
    mockNotif.granted = true;
    useSessions.getState().tap(NOW);
    await flushAsync();
    expect(scheduled()).toHaveLength(0);
    useSessions.getState().tap(NOW + 45 * SECOND);
    await flushAsync();
    expect(scheduled()).toEqual([`${SESSION_OPEN_ID}:0`]);
    const first = mockNotifState.pending.get(`${SESSION_OPEN_ID}:0`)!;
    expect((first.trigger as { date: Date }).date.getTime()).toBe(NOW + 45 * SECOND + IDLE_PROMPT_MS);
    expect(first.content.body).toBe('Still timing? Your session is open. Tap to review or end it.');
    expect(first.content.data).toEqual({ url: 'contractiontimer://timer' });
    useSessions.getState().tap(NOW + 5 * MINUTE);
    await flushAsync();
    expect(scheduled()).toHaveLength(0);
  });

  it('is cancelled when the session ends', async () => {
    mockNotif.granted = true;
    useSessions.getState().tap(NOW);
    useSessions.getState().tap(NOW + 45 * SECOND);
    await flushAsync();
    expect(scheduled()).toHaveLength(1);
    useSessions.getState().endActive(NOW + MINUTE);
    await flushAsync();
    expect(scheduled()).toHaveLength(0);
  });

  it('is moved by "Keep"', async () => {
    mockNotif.granted = true;
    useSessions.getState().tap(NOW);
    useSessions.getState().tap(NOW + 45 * SECOND);
    useSessions.getState().keepActive(NOW + IDLE_PROMPT_MS);
    await flushAsync();
    const n = mockNotifState.pending.get(`${SESSION_OPEN_ID}:0`)!;
    expect((n.trigger as { date: Date }).date.getTime()).toBe(NOW + IDLE_PROMPT_MS + IDLE_PROMPT_MS);
  });

  it('is never scheduled, and permission is never asked for, without permission already granted', async () => {
    mockNotif.granted = false;
    useSessions.getState().tap(NOW);
    useSessions.getState().tap(NOW + 45 * SECOND);
    await flushAsync();
    expect(scheduled()).toHaveLength(0);
    expect(mockNotif.granted).toBe(false);
  });

  it('uses low-importance silent channels for the weekly card and this note, and a default one for the kick reminder', async () => {
    jest.replaceProperty(Platform, 'OS', 'android'); // channels exist on Android only
    let setup!: () => Promise<void>;
    jest.isolateModules(() => {
      require('@/bootstrap');
      setup = require('../index').setupNotifications;
    });
    await setup();
    expect(mockNotifState.channels.get('timing')).toMatchObject({ importance: 2, sound: null });
    expect(mockNotifState.channels.get('weekly')).toMatchObject({ importance: 2, sound: null });
    expect(mockNotifState.channels.get('kick-reminder')).toMatchObject({ importance: 3 });
  });
});
