import { mockNotif, mockNotifState, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { SOFT_LIMIT_MS } from '@/domain/kicks';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { dateKeyFor } from '@/domain/dateKey';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import Kicks from '../../app/(tabs)/kicks/index';
import KickHistory from '../../app/(tabs)/kicks/history';

const NOW = new Date(2026, 10, 4, 20, 0).getTime();
const wrap = (el: React.ReactElement) => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
    {el}
  </ThemeProvider>
);
const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(new Date(NOW));
  useKicks.setState({ active: null, history: [] });
  (Haptics.impactAsync as jest.Mock).mockClear();
  mockRouter.push.mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('the Kicks tab', () => {
  it('opens on "Start counting" with the tip about flutters and the reminder chip', async () => {
    const ui = await render(wrap(<Kicks />));
    expect(ui.byLabel('Start counting movements')).toHaveLength(1);
    expect(ui.texts()).toContain('Find a comfortable spot. Tap once for each movement. Movements within a second of each other count as one.');
    expect(ui.texts()).toContain('Daily reminder: Off');
  });

  it('counts: big number, light haptic per movement, undo, time so far', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press('Start counting movements');
    expect(ui.texts()).toContain('Tap for each movement');
    await advance(5000);
    await ui.press('Count a movement. 0 of 10 so far');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    await advance(5000);
    await ui.press('Count a movement. 1 of 10 so far');
    expect(ui.texts()).toContain('2');
    expect(ui.texts()).toContain('0:10 so far');
    await ui.press('Undo last movement');
    expect(ui.texts()).toContain('1');
  });

  it('completes at 10: "10 movements in 14 min. Nicely done." and Save files it', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press('Start counting movements');
    for (let i = 0; i < 10; i++) {
      await advance(i === 9 ? 84_000 : 84_000);
      await ui.press(/^Count a movement/);
    }
    expect(ui.texts()).toContain('10 movements in 14 min. Nicely done.');
    await ui.press('Save');
    expect(useKicks.getState().history).toHaveLength(1);
    expect(useKicks.getState().active).toBeNull();
    expect(ui.texts()).toContain('Saved');
  });

  it('shows the calm provider message after 2 hours, word for word, and nothing alarming before', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press('Start counting movements');
    await advance(SOFT_LIMIT_MS - 5000);
    expect(ui.texts()).not.toContain("It's been 2 hours. If you've noticed fewer movements than usual, contact your provider today.");
    await advance(6000);
    expect(ui.texts()).toContain("It's been 2 hours. If you've noticed fewer movements than usual, contact your provider today.");
    expect(ui.texts().join(' ').toLowerCase()).not.toMatch(/wrong|danger|emergency|urgent/);
  });

  it('closes by itself at 3 hours, saves what was counted and says so', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press('Start counting movements');
    await advance(5000);
    await ui.press(/^Count a movement/);
    await advance(3 * 60 * 60_000);
    expect(ui.texts()).toContain('This count ended after 3 hours and was saved.');
    expect(useKicks.getState().history).toHaveLength(1);
  });

  it('End saves a partial count, and ending with nothing counted keeps nothing', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press('Start counting movements');
    await ui.press('End');
    expect(useKicks.getState().history).toHaveLength(0);
    await ui.press('Start counting movements');
    await advance(5000);
    await ui.press(/^Count a movement/);
    await ui.press('End');
    expect(useKicks.getState().history).toHaveLength(1);
  });

  it('says "Tap Start whenever you\'re ready to count." on the first day when kicks were the only need', async () => {
    useProfile.getState().update({ needs: ['kicks'] });
    useMeta.getState().update({ onboardingDay: dateKeyFor(new Date(NOW)) });
    const ui = await render(wrap(<Kicks />));
    expect(ui.texts()).toContain("Tap Start whenever you're ready to count.");
  });

  it('resumes a count after a kill', async () => {
    let ui = await render(wrap(<Kicks />));
    await ui.press('Start counting movements');
    await advance(5000);
    await ui.press(/^Count a movement/);
    await cleanup();
    useKicks.setState({ active: null, history: [] });
    const { reloadKicksFromDisk } = require('@/store/kicks') as typeof import('@/store/kicks');
    reloadKicksFromDisk();
    ui = await render(wrap(<Kicks />));
    expect(ui.byLabel('Count a movement. 1 of 10 so far')).toHaveLength(1);
  });

  it('opens the history', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press('History');
    expect(mockRouter.push).toHaveBeenCalledWith('/kicks/history');
  });
});

describe('the daily reminder (plan F18, §10)', () => {
  it('explains first, asks the phone for permission only on "Turn on", then schedules one daily notification', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press(/^Daily reminder: Off/);
    expect(ui.texts()).toContain('Daily kick reminder');
    expect(mockNotif.granted).toBe(false);
    expect(mockNotifState.pending.size).toBe(0);
    await ui.press('Turn on');
    expect(mockNotif.granted).toBe(true);
    expect(useSettings.getState().settings.kickReminder).toEqual({ enabled: true, hour: 20, minute: 0 });
    const n = mockNotifState.pending.get('kick-reminder')!;
    expect(n.trigger).toMatchObject({ type: 'daily', hour: 20, minute: 0, channelId: 'kick-reminder' });
    expect(n.content.body).toBe('Time for your kick count? Find a comfy spot and tap Start.');
    expect(n.content.data).toEqual({ url: 'contractiontimer://kicks' });
  });

  it('"Not now" asks for nothing', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press(/^Daily reminder: Off/);
    await ui.press('Not now');
    expect(mockNotif.granted).toBe(false);
    expect(useSettings.getState().settings.kickReminder.enabled).toBe(false);
  });

  it('when the phone refuses, says so kindly and leaves the reminder off', async () => {
    mockNotif.answer = false;
    mockNotif.keepAsking = true;
    const ui = await render(wrap(<Kicks />));
    await ui.press(/^Daily reminder: Off/);
    await ui.press('Turn on');
    expect(ui.texts()).toContain('No problem. You can turn reminders on later in More.');
    expect(useSettings.getState().settings.kickReminder.enabled).toBe(false);
    expect(mockNotifState.pending.size).toBe(0);
  });

  it('when refused for good, points to the phone settings', async () => {
    mockNotif.answer = false;
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const ui = await render(wrap(<Kicks />));
    await ui.press(/^Daily reminder: Off/);
    await ui.press('Turn on');
    expect(ui.texts()).toContain("Notifications are turned off for this app in your phone's settings.");
    await ui.press('Open phone settings');
    expect(open).toHaveBeenCalled();
  });

  it('a change of time reschedules, and Turn off cancels', async () => {
    const ui = await render(wrap(<Kicks />));
    await ui.press(/^Daily reminder: Off/);
    await ui.press('Turn on');
    await ui.press(/^Daily reminder: 8:00 PM/);
    await ui.press('One hour later');
    await flush();
    expect(mockNotifState.pending.get('kick-reminder')!.trigger).toMatchObject({ hour: 21, minute: 0 });
    await ui.press('Fifteen minutes earlier');
    await flush();
    expect(mockNotifState.pending.get('kick-reminder')!.trigger).toMatchObject({ hour: 20, minute: 45 });
    await ui.press('Turn off');
    await flush();
    expect(mockNotifState.pending.size).toBe(0);
    expect(useSettings.getState().settings.kickReminder.enabled).toBe(false);
  });
});

describe('the kick history', () => {
  const save = (startOffset: number, taps: number, minutes: number) => {
    useKicks.getState().start(NOW + startOffset);
    for (let i = 1; i <= taps; i++) useKicks.getState().tap(NOW + startOffset + ((i * minutes * 60_000) / taps));
    useKicks.getState().finish(NOW + startOffset + minutes * 60_000 + 1000);
  };

  it('shows the plan\'s empty state', async () => {
    const ui = await render(wrap(<KickHistory />));
    expect(ui.texts()).toContain('No counts yet. When you save one, it will be kept here, only on this phone.');
  });

  it('lists counts newest first and describes the line in words for the screen reader', async () => {
    save(-3 * 86_400_000, 10, 20);
    save(-2 * 86_400_000, 10, 16);
    save(-86_400_000, 10, 14);
    const ui = await render(wrap(<KickHistory />));
    expect(ui.texts().filter((x) => x.includes('10 movements in')).map((x) => x.split('· ')[1])).toEqual(['10 movements in 14 min', '10 movements in 16 min', '10 movements in 20 min']);
    expect(ui.byLabel('Minutes to reach the target over your last 3 counts: from 20 to 14')).toHaveLength(1);
  });

  it('shows a count that ended before the target as it is', async () => {
    save(-86_400_000, 6, 30);
    const ui = await render(wrap(<KickHistory />));
    expect(ui.texts().some((x) => x.includes('6 of 10 movements, ended after 30 min'))).toBe(true);
  });
});
