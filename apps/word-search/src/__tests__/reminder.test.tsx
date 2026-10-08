import { mockAudio, mockGestures, mockLastNotificationResponse, mockNotif, mockNotifState, mockParams, mockReview, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Dimensions, Linking, Platform } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { dailyPuzzle } from '@/domain/daily';
import { wordCells } from '@/domain/generator';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { levelPuzzle } from '@/domain/puzzles';
import { cellCenter } from '@/domain/selection';
import { ReminderSheet } from '@/components/ReminderSheet';
import { disableReminder, enableReminder, setupNotifications, syncReminder, useNotificationResponses } from '@/notifications/reminder';
import { useAds } from '@/store/ads';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { useReminderPrompt } from '@/store/reminder';
import { useResult } from '@/store/result';
import { useReview } from '@/store/review';
import { useSettings } from '@/store/settings';
import { useStats } from '@/store/stats';
import { db } from '@/store/storage';
import { palette, TOUCH_TARGET } from '@/theme/tokens';
import { formatTime } from '@/ui/format';
import Complete, { REVIEW_DELAY_MS } from '../../app/complete/[puzzleId]';
import Play from '../../app/play/[puzzleId]';
import Privacy from '../../app/privacy';
import SettingsScreen from '../../app/(tabs)/settings';

const NOW = new Date(2026, 9, 8, 7, 0);
const TODAY = '2026-10-08';
const width = Dimensions.get('window').width;
const wrap = (el: React.ReactElement) => <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  jest.clearAllMocks();
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('onboarding.completedAt');
  delete process.env.EXPO_PUBLIC_CONTACT_EMAIL;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const pending = () => [...mockNotifState.pending.values()].sort((a, b) => a.identifier.localeCompare(b.identifier, undefined, { numeric: true }));
const turnOn = (hour = 9, minute = 0) => {
  mockNotif.granted = true;
  useSettings.getState().update({ reminder: { enabled: true, hour, minute } });
};

describe('scheduling the daily reminder (plan §10)', () => {
  it('creates the "Daily puzzle" channel with default importance and no sound override', async () => {
    jest.replaceProperty(Platform, 'OS', 'android'); // channels exist on Android only
    await setupNotifications();
    const channel = mockNotifState.channels.get('daily-puzzle')!;
    expect(channel).toMatchObject({ name: 'Daily puzzle', importance: 3 });
    expect(channel).not.toHaveProperty('sound');
  });

  it('schedules nothing while reminders are off, or without the permission', async () => {
    expect(await syncReminder(NOW)).toBe(0);
    useSettings.getState().update({ reminder: { enabled: true, hour: 9, minute: 0 } });
    mockNotif.granted = false;
    expect(await syncReminder(NOW)).toBe(0);
    expect(pending()).toHaveLength(0);
  });

  it('plans one reminder a day for a week, with that day\'s theme and the date for the deep link', async () => {
    turnOn();
    expect(await syncReminder(NOW)).toBe(7);
    const list = pending();
    expect(list).toHaveLength(7);
    expect(list.map((p) => (p.content.data as { dateKey: string }).dateKey)).toEqual(['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']);
    for (const p of list) {
      expect(p.content.title).toBe('Word Search');
      expect(String(p.content.body)).not.toMatch(/\{|undefined/);
      expect(p.trigger).toMatchObject({ type: 'date', channelId: 'daily-puzzle' });
    }
    expect(new Set(list.map((p) => p.content.body)).size).toBeGreaterThan(1); // the lines rotate
    expect(list.some((p) => /today's theme: \w+/i.test(String(p.content.body)))).toBe(true);
  });

  it('skips today\'s reminder once today\'s daily puzzle is done, and brings the plan back to normal tomorrow', async () => {
    turnOn();
    useDaily.getState().complete(TODAY, TODAY, 3);
    expect(await syncReminder(NOW)).toBe(6);
    expect((pending()[0].content.data as { dateKey: string }).dateKey).toBe('2026-10-09');
    const tomorrow = new Date(2026, 9, 9, 7, 0);
    useDaily.getState().reset();
    expect(await syncReminder(tomorrow)).toBe(7);
  });

  it('re-plans when the time changes and never leaves old ones behind', async () => {
    turnOn(9, 0);
    await syncReminder(NOW);
    useSettings.getState().update({ reminder: { enabled: true, hour: 19, minute: 30 } });
    await syncReminder(NOW);
    expect(pending()).toHaveLength(7);
    expect(pending().every((p) => (p.trigger as { date: Date }).date.getHours() === 19)).toBe(true);
  });

  it('cancels everything when turned off', async () => {
    turnOn();
    await syncReminder(NOW);
    await disableReminder();
    expect(pending()).toHaveLength(0);
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
  });

  it('stops after a week of the app never being opened: no endless nagging', async () => {
    turnOn();
    await syncReminder(NOW);
    const last = pending().at(-1)!;
    expect(new Date((last.trigger as { date: Date }).date).getTime() - NOW.getTime()).toBeLessThan(7 * 86_400_000);
    expect(pending()).toHaveLength(7);
  });
});

describe('turning the reminder on', () => {
  it('asks the system for permission and plans once it is granted', async () => {
    expect(await enableReminder(13, 0)).toBe('enabled');
    expect(mockNotif.granted).toBe(true);
    expect(useSettings.getState().settings.reminder).toEqual({ enabled: true, hour: 13, minute: 0 });
    expect(pending().length).toBeGreaterThan(0);
  });
  it('says "denied" when the player refuses but can be asked again', async () => {
    mockNotif.answer = false;
    mockNotif.keepAsking = true;
    expect(await enableReminder(9, 0)).toBe('denied');
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
    expect(pending()).toHaveLength(0);
  });
  it('says "blocked" when the permission was refused for good, and does not ask again', async () => {
    mockNotif.canAskAgain = false;
    expect(await enableReminder(9, 0)).toBe('blocked');
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
  });
});

describe('the pre-prompt sheet', () => {
  const open = async (onClose = jest.fn()) => {
    const ui = await render(wrap(<ReminderSheet visible onClose={onClose} />));
    return { ui, onClose };
  };
  it('explains the reminder and offers 9:00 AM, 1:00 PM, 7:00 PM and a custom time', async () => {
    const { ui } = await open();
    expect(ui.texts()).toContain("Want a reminder for tomorrow's puzzle?");
    expect(ui.texts()).toContain("We'll send one gentle reminder a day. You can turn it off anytime.");
    for (const [h, m] of [[9, 0], [13, 0], [19, 0]]) expect(ui.byLabel(formatTime(h, m))).toHaveLength(1);
    expect(ui.byLabel('Choose time')).toHaveLength(1);
  });
  it('"Yes, remind me" asks for permission only now, at the chosen time', async () => {
    const { ui, onClose } = await open();
    expect(mockNotif.granted).toBe(false); // nothing asked yet
    await ui.press(formatTime(19, 0));
    await ui.press('Yes, remind me');
    await flush();
    expect(useSettings.getState().settings.reminder).toEqual({ enabled: true, hour: 19, minute: 0 });
    expect(onClose).toHaveBeenCalled();
  });
  it('lets the player choose any time with big buttons', async () => {
    const { ui } = await open();
    await ui.press('Choose time');
    await ui.press('Later hour');
    await ui.press('Later minutes');
    await ui.press('Later minutes');
    await ui.press('Yes, remind me');
    await flush();
    expect(useSettings.getState().settings.reminder).toEqual({ enabled: true, hour: 10, minute: 30 });
  });
  it('"Not now" closes it and turns nothing on', async () => {
    const { ui, onClose } = await open();
    await ui.press('Not now');
    expect(onClose).toHaveBeenCalled();
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
    expect(mockNotif.granted).toBe(false);
  });
  it('explains a refusal and can open the phone settings when it was refused for good', async () => {
    mockNotif.canAskAgain = false;
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const { ui, onClose } = await open();
    await ui.press('Yes, remind me');
    await flush();
    expect(ui.texts()).toContain("Notifications are turned off for this app in your phone's settings.");
    expect(onClose).not.toHaveBeenCalled();
    await ui.press('Open phone settings');
    expect(openSettings).toHaveBeenCalled();
  });
  it('says "denied" when it can be tried again', async () => {
    mockNotif.answer = false;
    mockNotif.keepAsking = true;
    const { ui } = await open();
    await ui.press('Yes, remind me');
    await flush();
    expect(ui.texts().join(' ')).toContain('Notifications are off, so no reminder was set');
  });
});

describe('tapping a reminder (plan §10 deep link)', () => {
  const Probe = () => {
    useNotificationResponses();
    return null;
  };
  const tap = (id: string, dateKey = '2026-10-09') => {
    mockLastNotificationResponse.current = {
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: { request: { identifier: id, content: { data: { dateKey } } } },
    };
  };
  const ready = () => {
    sharedStore.set('onboarding.completedAt', 1);
    db.set('onboarding.tutorialDone', true);
  };

  it('opens that day\'s puzzle at the preferred difficulty, once, and counts as an external open', async () => {
    ready();
    useSettings.getState().update({ difficulty: 'medium' });
    tap('n1');
    const ui = await render(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'daily:2026-10-09:medium' } });
    expect(useAds.getState().lastExternalOpenAt).toBeGreaterThan(0);
    await ui.update(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });
  it('goes back into the daily puzzle already in progress', async () => {
    ready();
    useGame.getState().begin(dailyPuzzle('2026-10-09', 'hard', 8));
    tap('n2');
    await render(<Probe />);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'daily:2026-10-09:hard' } });
  });
  it('does nothing before the tutorial is done (the first launch is not hijacked)', async () => {
    tap('n3');
    await render(<Probe />);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  it('ignores other notification actions', async () => {
    ready();
    mockLastNotificationResponse.current = { actionIdentifier: 'something.else', notification: { request: { identifier: 'n4', content: { data: {} } } } };
    await render(<Probe />);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

describe('Complete screen prompts (plan §10, §12)', () => {
  const finished = (over: Record<string, unknown> = {}) => ({ puzzleId: 'animals:easy:3', packId: 'animals', difficulty: 'easy' as const, level: 3, isDaily: false, isTutorial: false, stars: 2 as const, wordsFound: 6, elapsedMs: 0, hintsUsed: 1, ...over });
  const show = async (r = finished()) => {
    useResult.getState().set(r);
    const ui = await render(wrap(<Complete />));
    await act(async () => {
      jest.advanceTimersByTime(REVIEW_DELAY_MS + 10);
    });
    await flush();
    return ui;
  };
  const PROMPT = "Want a reminder for tomorrow's puzzle?";

  it('does not ask for a reminder on the first or second puzzle', async () => {
    useReminderPrompt.setState({ prompt: { askCount: 0, askedAt: 0, completions: 2 } });
    const ui = await show();
    expect(ui.texts()).not.toContain(PROMPT);
  });
  it('asks after the 3rd puzzle, and counts the ask', async () => {
    useReminderPrompt.setState({ prompt: { askCount: 0, askedAt: 0, completions: 3 } });
    const ui = await show();
    expect(ui.texts()).toContain(PROMPT);
    expect(useReminderPrompt.getState().prompt.askCount).toBe(1);
  });
  it('asks after the first daily completion', async () => {
    const ui = await show(finished({ isDaily: true, level: undefined, dateKey: TODAY, puzzleId: `daily:${TODAY}:easy`, streak: 1, streakCounted: true }));
    expect(ui.texts()).toContain(PROMPT);
  });
  it('does not ask after the tutorial', async () => {
    useReminderPrompt.setState({ prompt: { askCount: 0, askedAt: 0, completions: 9 } });
    const ui = await show(finished({ isTutorial: true, level: undefined }));
    expect(ui.texts()).not.toContain(PROMPT);
  });
  it('asks again once after 7 days of "Not now", not before', async () => {
    useReminderPrompt.setState({ prompt: { askCount: 1, askedAt: Date.now() - 6 * 86_400_000, completions: 9 } });
    expect((await show()).texts()).not.toContain(PROMPT);
    await cleanup();
    useReminderPrompt.setState({ prompt: { askCount: 1, askedAt: Date.now() - 8 * 86_400_000, completions: 9 } });
    expect((await show()).texts()).toContain(PROMPT);
  });
  it('does not ask when reminders are already on', async () => {
    useSettings.getState().update({ reminder: { enabled: true, hour: 9, minute: 0 } });
    useReminderPrompt.setState({ prompt: { askCount: 0, askedAt: 0, completions: 9 } });
    expect((await show()).texts()).not.toContain(PROMPT);
  });

  describe('the store review', () => {
    const eligible = () => {
      mockReview.available = true;
      useStats.setState({ stats: { ...useStats.getState().stats, sessions: 3, puzzlesCompleted: 5 } });
      useSettings.getState().update({ reminder: { enabled: true, hour: 9, minute: 0 } }); // no reminder sheet in the way
      sharedStore.set('install.firstOpenAt', 0);
    };
    it('is requested after a 3-star finish when every condition holds, and recorded', async () => {
      eligible();
      await show(finished({ stars: 3 }));
      expect(mockReview.request).toHaveBeenCalledTimes(1);
      expect(useReview.getState().review.promptCount).toBe(1);
    });
    it('is not requested for a 2-star finish, too few sessions or puzzles, or soon after an ad', async () => {
      eligible();
      await show(finished({ stars: 2 }));
      await cleanup();
      useStats.setState({ stats: { ...useStats.getState().stats, sessions: 2 } });
      await show(finished({ stars: 3 }));
      await cleanup();
      useStats.setState({ stats: { ...useStats.getState().stats, sessions: 3, puzzlesCompleted: 4 } });
      await show(finished({ stars: 3 }));
      await cleanup();
      useStats.setState({ stats: { ...useStats.getState().stats, puzzlesCompleted: 5 } });
      useAds.setState({ lastFullScreenAt: Date.now() - 20_000 });
      await show(finished({ stars: 3 }));
      expect(mockReview.request).not.toHaveBeenCalled();
    });
    it('is requested for a 7-day streak even with 1 star, but not for a catch-up day', async () => {
      eligible();
      await show(finished({ stars: 1, isDaily: true, level: undefined, dateKey: TODAY, streak: 7, streakCounted: true }));
      expect(mockReview.request).toHaveBeenCalledTimes(1);
      await cleanup();
      useReview.setState({ review: { promptCount: 0, positiveMoments: 0 } });
      mockReview.request.mockClear();
      await show(finished({ stars: 1, isDaily: true, level: undefined, dateKey: TODAY, streak: 7, streakCounted: false }));
      expect(mockReview.request).not.toHaveBeenCalled();
    });
    it('waits 30 days and stops after 3, with no "do you like the app?" question first', async () => {
      eligible();
      useReview.setState({ review: { promptCount: 1, lastPromptAt: Date.now() - 10 * 86_400_000, positiveMoments: 0 } });
      const ui = await show(finished({ stars: 3 }));
      expect(mockReview.request).not.toHaveBeenCalled();
      expect(ui.texts().join(' ')).not.toMatch(/do you like/i);
    });
    it('shows the reminder sheet instead of the review when both are due', async () => {
      eligible();
      useSettings.getState().update({ reminder: { enabled: false, hour: 9, minute: 0 } });
      useReminderPrompt.setState({ prompt: { askCount: 0, askedAt: 0, completions: 5 } });
      const ui = await show(finished({ stars: 3 }));
      expect(ui.texts()).toContain(PROMPT);
      expect(mockReview.request).not.toHaveBeenCalled();
    });
  });
});

describe('sounds in the game', () => {
  it('plays a chime for a found word', async () => {
    mockParams.current = { puzzleId: 'animals:easy:1' };
    await render(wrap(<Play />));
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    await flush();
    const size = effectiveGridSize('easy', 'large', width);
    const puzzle = levelPuzzle('animals', 'easy', 1, size);
    const cell = cellSizeFor(size, width);
    const span = wordCells(puzzle.words[0], size);
    const tapAt = (n: number) => act(async () => mockGestures.tap.onEnd!({ ...cellCenter({ row: Math.floor(n / size), col: n % size }, cell) }, true));
    await tapAt(span[0]);
    await tapAt(span[span.length - 1]);
    expect(mockAudio.players).toHaveLength(1);
    expect(mockAudio.players[0].play).toHaveBeenCalledTimes(1);
  });
});

describe('Settings: reminder, sounds, rate, feedback and privacy', () => {
  it('turns the reminder on with the permission flow, changes its time, and turns it off', async () => {
    const ui = await render(wrap(<SettingsScreen />));
    const toggle = () => ui.root.findAll((n) => typeof n.props.onValueChange === 'function' && n.props.accessibilityLabel === 'Remind me every day')[0];
    await act(async () => toggle().props.onValueChange(true));
    await flush();
    expect(useSettings.getState().settings.reminder.enabled).toBe(true);
    expect(ui.texts()).toContain(`Reminder time: ${formatTime(9, 0)}`);
    await ui.press('Later hour');
    await flush();
    expect(useSettings.getState().settings.reminder.hour).toBe(10);
    expect(pending().every((p) => (p.trigger as { date: Date }).date.getHours() === 10)).toBe(true);
    await act(async () => toggle().props.onValueChange(false));
    await flush();
    expect(pending()).toHaveLength(0);
    expect(ui.byLabel('Later hour')).toHaveLength(0);
  });

  it('explains a refused permission and keeps the switch off', async () => {
    mockNotif.canAskAgain = false;
    const ui = await render(wrap(<SettingsScreen />));
    const toggle = ui.root.findAll((n) => typeof n.props.onValueChange === 'function' && n.props.accessibilityLabel === 'Remind me every day')[0];
    await act(async () => toggle.props.onValueChange(true));
    await flush();
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
    expect(ui.texts()).toContain("Notifications are turned off for this app in your phone's settings.");
  });

  it('turns the sounds off', async () => {
    const ui = await render(wrap(<SettingsScreen />));
    const toggle = ui.root.findAll((n) => typeof n.props.onValueChange === 'function' && n.props.accessibilityLabel === 'Sounds')[0];
    await act(async () => toggle.props.onValueChange(false));
    expect(useSettings.getState().settings.sounds).toBe(false);
  });

  it('opens the Play Store to rate, falling back to the web page', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('no market app')).mockResolvedValue(true as never);
    const ui = await render(wrap(<SettingsScreen />));
    await ui.press('Rate the app');
    await flush();
    expect(open).toHaveBeenNthCalledWith(1, 'market://details?id=com.fiveapps.wordsearchlarge');
    expect(open).toHaveBeenNthCalledWith(2, 'https://play.google.com/store/apps/details?id=com.fiveapps.wordsearchlarge');
  });

  it('shows "Send feedback" only when a contact email is configured, with the version prefilled', async () => {
    const without = await render(wrap(<SettingsScreen />));
    expect(without.byLabel('Send feedback')).toHaveLength(0);
    await cleanup();
    process.env.EXPO_PUBLIC_CONTACT_EMAIL = 'hello@example.com';
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const ui = await render(wrap(<SettingsScreen />));
    await ui.press('Send feedback');
    const url = String(open.mock.calls[0][0]);
    expect(url.startsWith('mailto:hello@example.com?subject=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('App version: 1.0.0');
  });

  it('opens the plain-language privacy screen', async () => {
    const ui = await render(wrap(<SettingsScreen />));
    await ui.press('How your data is handled');
    expect(mockRouter.push).toHaveBeenCalledWith('/privacy');
    await cleanup();
    const page = await render(wrap(<Privacy />));
    expect(page.texts().join(' ')).toMatch(/stored only on this phone/);
    expect(page.texts().join(' ')).toMatch(/AdMob/);
    await page.press('Done');
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('keeps reminder and sound choices when progress is reset', async () => {
    useSettings.getState().update({ sounds: false, reminder: { enabled: true, hour: 19, minute: 0 } });
    const { resetProgress } = require('@/features/settings/reset') as typeof import('@/features/settings/reset');
    resetProgress();
    expect(useSettings.getState().settings).toMatchObject({ sounds: false, reminder: { enabled: true, hour: 19, minute: 0 } });
    void useStats;
  });
});
