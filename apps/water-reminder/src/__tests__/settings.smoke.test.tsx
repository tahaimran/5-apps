import { mockDevice, mockFiles, mockNotif, mockPicker, mockRouter, mockShare, resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Alert, Linking } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { ReactElement } from 'react';

const mockRewarded = { rewarded: true };
const mockShowRewarded = jest.fn(async (_p: string) => ({ rewarded: mockRewarded.rewarded }));
jest.mock('@shared/ads', () => ({
  ...jest.requireActual('@shared/ads'),
  showRewarded: (p: string) => mockShowRewarded(p),
  isRewardedReady: () => true,
}));
const mockConsent = { required: true, opened: jest.fn(async () => undefined) };
jest.mock('@shared/consent', () => ({
  ...jest.requireActual('@shared/consent'),
  isPrivacyOptionsRequired: async () => mockConsent.required,
  openPrivacyOptions: () => mockConsent.opened(),
}));

import Garden from '../../app/(tabs)/garden';
import SettingsIndex from '../../app/settings/index';
import GoalSettings from '../../app/settings/goal';
import RemindersSettings from '../../app/settings/reminders';
import CupsSettings from '../../app/settings/cups';
import BeveragesSettings from '../../app/settings/beverages';
import BatteryGuide from '../../app/settings/battery-guide';
import Privacy from '../../app/settings/privacy';
import Backup from '../../app/settings/backup';
import { useCelebration } from '@/store/celebrations';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { palette } from '@/theme/tokens';

const TODAY = '2026-10-08';
const NOW = new Date(2026, 9, 8, 14, 0);
const themed = (el: ReactElement, scale = 1) => <ThemeProvider palette={palette} fontScale={scale}>{el}</ThemeProvider>;
const at = (h: number, d = 8) => new Date(2026, 9, d, h).getTime();
const alertPress = (style: 'cancel' | 'destructive') => jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => void buttons?.find((b) => b.style === style)?.onPress?.());

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  resetNotifMock();
  mockNotif.granted = true;
  mockRewarded.rewarded = true;
  mockShowRewarded.mockClear();
  mockConsent.required = true;
  mockConsent.opened.mockClear();
  mockDevice.manufacturer = 'Google';
  mockFiles.clear();
  mockPicker.result = 'canceled';
  mockShare.mockClear();
  sharedStore.set('onboarding.completedAt', 1);
  for (const fn of Object.values(mockRouter)) if (typeof fn === 'function' && 'mockClear' in fn) (fn as jest.Mock).mockClear();
  useToday.setState({ today: TODAY });
  useCelebration.setState({ current: null });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Garden (plan §5.3)', () => {
  it('shows the stage, how far the next one is, the streaks and the freezes', async () => {
    useWater.getState().setProgress({ goalDays: 7, stage: 2, streak: 3, bestStreak: 5, streakFreezes: 1 });
    const ui = await render(themed(<Garden />));
    expect(ui.texts()).toContain('Seedling');
    expect(ui.texts()).toContain('3 of 6 goal days to Young plant');
    expect(ui.byLabel('Streak: 3 days')).toHaveLength(1);
    expect(ui.byLabel('Best streak: 5 days')).toHaveLength(1);
    expect(ui.byLabel('Streak freezes: 1')).toHaveLength(1);
  });
  it('says the plant is fully grown at the last stage', async () => {
    useWater.getState().setProgress({ goalDays: 30, stage: 4 });
    expect((await render(themed(<Garden />))).texts()).toContain('Your plant is fully grown. Keep it happy!');
  });
  it('counts today when the goal is reached', async () => {
    useWater.getState().logDrink({ volumeMl: 2000 });
    const ui = await render(themed(<Garden />));
    expect(ui.texts()).toContain('Sprout');
    expect(ui.byLabel('Streak: 1 days')).toHaveLength(1);
  });

  describe('streak freeze by rewarded ad (F8)', () => {
    it('grants one freeze only when the reward is earned, then waits a day', async () => {
      const ui = await render(themed(<Garden />));
      await ui.press('Watch an ad for a streak freeze');
      expect(mockShowRewarded).toHaveBeenCalledWith('streak_freeze');
      expect(useWater.getState().progress.streakFreezes).toBe(1);
      expect(useSettings.getState().prefs.freezeEarnedDay).toBe(TODAY);
      expect(ui.texts()).toContain('Done! Your reward is in your garden.');
      expect(ui.texts()).toContain('You earned a streak freeze today. Come back tomorrow for another.');
      expect(ui.byLabel('Watch an ad for a streak freeze').some((n) => n.props.accessibilityState?.disabled)).toBe(true);
    });
    it('gives nothing, and says so, when the ad was not watched to the end or is unavailable', async () => {
      mockRewarded.rewarded = false;
      const ui = await render(themed(<Garden />));
      await ui.press('Watch an ad for a streak freeze');
      expect(useWater.getState().progress.streakFreezes).toBe(0);
      expect(ui.texts()).toContain('Ad not available, try later.');
      mockRewarded.rewarded = true;
      await ui.press('Watch an ad for a streak freeze');
      expect(useWater.getState().progress.streakFreezes).toBe(1);
    });
    it('stops at two freezes', async () => {
      useWater.getState().setProgress({ streakFreezes: 2 });
      const ui = await render(themed(<Garden />));
      expect(ui.texts()).toContain('You already hold two streak freezes.');
      expect(mockShowRewarded).not.toHaveBeenCalled();
    });
    it('is available again the next day', async () => {
      useSettings.getState().setPrefs({ freezeEarnedDay: '2026-10-07' });
      const ui = await render(themed(<Garden />));
      expect(ui.byLabel('Watch an ad for a streak freeze').some((n) => n.props.accessibilityState?.disabled)).toBe(false);
    });
  });

  describe('skins and cup themes', () => {
    it('lists 6 of each with their state', async () => {
      useWater.getState().setProgress({ bestStreak: 14 });
      const ui = await render(themed(<Garden />));
      expect(ui.byLabel('Clay, In use')).toHaveLength(1);
      expect(ui.byLabel('Sky, Tap to use')).toHaveLength(1);
      expect(ui.byLabel('Berry, Watch ad to unlock')).toHaveLength(1);
      expect(ui.byLabel('Mint, Tap to use')).toHaveLength(1); // 14-day best streak
      expect(ui.byLabel('Night, Reach a 30-day streak')).toHaveLength(1);
      expect(ui.byLabel('Ocean, In use')).toHaveLength(1);
      expect(ui.byLabel(/^(Clay|Sky|Berry|Sunny|Mint|Night), /)).toHaveLength(6);
      expect(ui.byLabel(/^(Ocean|Leaf|Peach|Lilac|Sun|Rose), /)).toHaveLength(6);
    });
    it('switches to a free skin and cup theme', async () => {
      const ui = await render(themed(<Garden />));
      await ui.press('Sky, Tap to use');
      await ui.press('Leaf, Tap to use');
      expect(useWater.getState().progress).toMatchObject({ activeSkin: 'sky', activeCupTheme: 'leaf' });
      expect(db.get('progress')).toMatchObject({ activeSkin: 'sky' });
    });
    it('unlocks with a rewarded ad and then lets the user use it', async () => {
      const ui = await render(themed(<Garden />));
      await ui.press('Berry, Watch ad to unlock');
      expect(mockShowRewarded).toHaveBeenCalledWith('garden_unlock_skin');
      expect(useWater.getState().progress.unlocked).toContain('skin:berry');
      expect(useSettings.getState().prefs.unlocksToday).toEqual({ day: TODAY, count: 1 });
      await ui.press('Berry, Tap to use');
      expect(useWater.getState().progress.activeSkin).toBe('berry');
    });
    it('keeps an item locked when the reward is not earned', async () => {
      mockRewarded.rewarded = false;
      const ui = await render(themed(<Garden />));
      await ui.press('Peach, Watch ad to unlock');
      expect(useWater.getState().progress.unlocked).not.toContain('cup:peach');
      expect(ui.texts()).toContain('Ad not available, try later.');
    });
    it('allows at most 10 ad unlocks a day', async () => {
      useSettings.getState().setPrefs({ unlocksToday: { day: TODAY, count: 10 } });
      const ui = await render(themed(<Garden />));
      expect(ui.texts()).toContain('0 ad unlocks left today');
      await ui.press('Sunny, Watch ad to unlock');
      expect(mockShowRewarded).not.toHaveBeenCalled();
      expect(ui.texts()).toContain('That is enough unlocks for today. Come back tomorrow.');
    });
    it('does not let a streak-only item be bought with an ad', async () => {
      const ui = await render(themed(<Garden />));
      expect(ui.byLabel('Night, Reach a 30-day streak').some((n) => n.props.accessibilityState?.disabled)).toBe(true);
    });
  });
});

describe('Settings index', () => {
  it('shows the goal, reminders and cup summaries and opens each screen', async () => {
    const ui = await render(themed(<SettingsIndex />));
    await ui.press('Daily goal, 2,000 ml');
    await ui.press('Reminders, 8 a day');
    await ui.press('Cups, 250 ml');
    await ui.press('Drinks and how they count');
    await ui.press('Privacy and ads');
    await ui.press('Battery and late reminders');
    await ui.press('Backup and restore');
    expect(mockRouter.push.mock.calls.map((c) => c[0])).toEqual([
      '/settings/goal',
      '/settings/reminders',
      '/settings/cups',
      '/settings/beverages',
      '/settings/privacy',
      '/settings/battery-guide',
      '/settings/backup',
    ]);
  });
  it('switches units, wake and bed times, and appearance', async () => {
    const ui = await render(themed(<SettingsIndex />));
    await ui.press('fl oz');
    expect(useSettings.getState().goal.unit).toBe('floz');
    expect(ui.byLabel('Daily goal, 67.6 fl oz')).toHaveLength(1);
    await ui.press('Later'); // the first "Later" is the wake hour
    expect(useSettings.getState().reminders.wakeMin).toBe(8 * 60);
    await ui.press('Dark');
    expect(sharedStore.get('theme.mode')).toBe('dark');
  });
  it('turns on large text and turns off vibration', async () => {
    const ui = await render(themed(<SettingsIndex />));
    const toggle = (label: string) => ui.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onValueChange === 'function')[0];
    await act(async () => toggle('Large text').props.onValueChange(true));
    await act(async () => toggle('Vibration feedback').props.onValueChange(false));
    expect(useSettings.getState().prefs).toMatchObject({ largeText: true, haptics: false });
  });
  it('opens the store page to rate', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const ui = await render(themed(<SettingsIndex />));
    await ui.press('Rate Sipling');
    expect(open).toHaveBeenCalledWith('market://details?id=com.fiveapps.sipling');
  });
  it('falls back to the web store page', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('no market')).mockResolvedValue(true);
    const ui = await render(themed(<SettingsIndex />));
    await ui.press('Rate Sipling');
    await flush();
    expect(open).toHaveBeenLastCalledWith('https://play.google.com/store/apps/details?id=com.fiveapps.sipling');
  });
  it('shows the privacy policy only when its URL is configured', async () => {
    const ui = await render(themed(<SettingsIndex />));
    expect(ui.byLabel('Privacy policy')).toHaveLength(0);
  });
  it('shows the version', async () => {
    expect((await render(themed(<SettingsIndex />))).texts()).toContain('Version 1.0.0');
  });
});

describe('Goal settings', () => {
  it('changes the goal by hand and remembers it was set by the user', async () => {
    const ui = await render(themed(<GoalSettings />));
    await ui.press('Higher goal');
    expect(useSettings.getState().goal).toMatchObject({ goalMl: 2050, source: 'manual' });
    expect(ui.texts().join('|')).toContain('Set by you');
  });
  it('re-runs the calculator and applies it as calculated', async () => {
    const ui = await render(themed(<GoalSettings />));
    await ui.press('Male');
    await ui.press('Active (workouts 3–5×/week)');
    await ui.press('Hot or humid');
    // 65 kg default weight unit is kg in settings: 2145 + 500 + 500 + 150 = 3295 → 3300
    expect(ui.texts()).toContain('Calculated: 3,300 ml');
    await ui.press('Use this goal');
    expect(useSettings.getState().goal).toMatchObject({ goalMl: 3300, source: 'calculated' });
    expect(useSettings.getState().profile).toMatchObject({ sex: 'male', activity: 'active', climate: 'hot', weightKg: 65 });
  });
  it('converts pounds for the calculation and keeps the unit', async () => {
    const ui = await render(themed(<GoalSettings />));
    await ui.press('lb');
    expect(ui.texts()).toContain('143 lb');
    await ui.press('Plus 5');
    await ui.press('Use this goal');
    expect(useSettings.getState().profile).toMatchObject({ weightUnit: 'lb', weightKg: 67.1 });
  });
  it('shows the wellness disclaimer', async () => {
    expect((await render(themed(<GoalSettings />))).texts()).toContain('A general wellness estimate, not medical advice. Ask a professional if you have a health condition.');
  });
});

describe('Reminder settings (F4, F5)', () => {
  it('summarizes the schedule and follows the frequency and window', async () => {
    useSettings.getState().setGoal({ goalMl: 2300 });
    const ui = await render(themed(<RemindersSettings />));
    expect(ui.texts()).toContain('About 10 reminders a day, from 07:30 to 22:30');
    await ui.press('At a fixed interval');
    await ui.press('Every 60 min');
    expect(useSettings.getState().reminders).toMatchObject({ frequency: 'interval', intervalMin: 60 });
    expect(ui.texts()).toContain('About 16 reminders a day, from 07:30 to 22:30');
  });
  it('sets style, snooze and the skip window', async () => {
    const ui = await render(themed(<RemindersSettings />));
    await ui.press('Gentle (silent banner)');
    await ui.press('30 min');
    expect(useSettings.getState().reminders).toMatchObject({ style: 'gentle', snoozeMin: 30 });
    await ui.press('Later'); // skip window stepper: 30 → 35
    expect(useSettings.getState().reminders.skipWindowMin).toBe(35);
  });
  it('switches reminders off and hides the options', async () => {
    const ui = await render(themed(<RemindersSettings />));
    const toggle = ui.root.findAll((n) => n.props.accessibilityLabel === 'Drink reminders' && typeof n.props.onValueChange === 'function')[0];
    await act(async () => toggle.props.onValueChange(false));
    expect(useSettings.getState().reminders.enabled).toBe(false);
    expect(ui.texts().some((t) => t.startsWith('About '))).toBe(false);
  });
  it('picks days, but never lets the last one go', async () => {
    const ui = await render(themed(<RemindersSettings />));
    for (const d of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) await ui.press(d);
    expect(useSettings.getState().reminders.activeWeekdays).toEqual([0]);
    await ui.press('Sun');
    expect(useSettings.getState().reminders.activeWeekdays).toEqual([0]);
    await ui.press('Mon');
    expect(useSettings.getState().reminders.activeWeekdays).toEqual([0, 1]);
  });
  it('adds, edits and removes a quiet time that takes slots out of the plan', async () => {
    useSettings.getState().setGoal({ goalMl: 2300 });
    const ui = await render(themed(<RemindersSettings />));
    await ui.press('Add a quiet time');
    expect(useSettings.getState().reminders.quietBlocks).toEqual([{ startMin: 720, endMin: 780 }]);
    expect(ui.texts()).toContain('About 9 reminders a day, from 07:30 to 22:30');
    await ui.press('Remove the quiet time from 12:00 to 13:00');
    expect(useSettings.getState().reminders.quietBlocks).toEqual([]);
  });
  it('offers to turn the permission on when it is off', async () => {
    mockNotif.granted = false;
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => void buttons?.[1].onPress?.());
    const ui = await render(themed(<RemindersSettings />));
    await ui.press('Turn on');
    await flush();
    expect(mockNotif.granted).toBe(true);
    alert.mockRestore();
  });
});

describe('Cups and drinks', () => {
  it('resizes a cup and makes another the preferred one', async () => {
    const ui = await render(themed(<CupsSettings />));
    await ui.press('Larger cup'); // first cup: 150 → 200
    expect(useSettings.getState().cups[0].ml).toBe(200);
    await ui.press('Make preferred'); // the first cup in the list
    expect(useSettings.getState().prefs.preferredCupId).toBe('cup-150');
    await ui.press('Reset cups');
    expect(useSettings.getState().cups[0].ml).toBe(150);
    expect(useSettings.getState().prefs.preferredCupId).toBe('cup-250');
  });
  it('changes how a drink counts and resets', async () => {
    const ui = await render(themed(<BeveragesSettings />));
    expect(ui.texts()).toContain('250 ml of Coffee counts as 200 ml');
    await ui.press('Count Coffee less');
    expect(useSettings.getState().beverages.find((b) => b.id === 'coffee')?.factor).toBe(0.75);
    for (let i = 0; i < 5; i++) await ui.press('Count Coffee less');
    expect(useSettings.getState().beverages.find((b) => b.id === 'coffee')?.factor).toBe(0.5);
    await ui.press('Reset to defaults');
    expect(useSettings.getState().beverages.find((b) => b.id === 'coffee')?.factor).toBe(0.8);
  });
});

describe('Battery guide (plan §5.6)', () => {
  it.each([
    ['samsung', 'Samsung', 'Add Sipling to Never sleeping apps.'],
    ['Xiaomi', 'Xiaomi, Redmi and POCO', 'Turn on Autostart.'],
    ['HUAWEI', 'Huawei and Honor', "Turn on Auto-launch, Secondary launch and Run in background."],
    ['OnePlus', 'OnePlus', "Find Sipling and choose Don't optimize."],
    ['OPPO', 'Oppo, Vivo and Realme', 'Turn on Auto-launch for Sipling in the app\'s info page.'],
    ['Google', 'Google Pixel', 'Make sure Notifications are on for Sipling.'],
    ['Nokia', 'Your phone', 'Look for an Autostart or Background activity switch for Sipling and turn it on.'],
  ])('shows the %s steps', async (manufacturer, title, step3) => {
    mockDevice.manufacturer = manufacturer;
    const ui = await render(themed(<BatteryGuide />));
    expect(ui.texts()).toContain(title);
    expect(ui.texts()).toContain(step3);
  });
  it('opens the system battery screen, falling back to app settings', async () => {
    const launcher = require('expo-intent-launcher').startActivityAsync as jest.Mock;
    const ui = await render(themed(<BatteryGuide />));
    await ui.press('Open battery settings');
    expect(launcher).toHaveBeenCalledWith('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    launcher.mockRejectedValueOnce(new Error('no activity'));
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await ui.press('Open battery settings');
    await flush();
    expect(open).toHaveBeenCalled();
  });
  it('links to dontkillmyapp.com for the vendor', async () => {
    mockDevice.manufacturer = 'samsung';
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const ui = await render(themed(<BatteryGuide />));
    await ui.press('More about your phone (dontkillmyapp.com)');
    expect(open).toHaveBeenCalledWith('https://dontkillmyapp.com/samsung');
  });
});

describe('Late-reminder card on Today', () => {
  it('is offered once after two suspected misses, and opens the guide', async () => {
    const Today = require('../../app/(tabs)/index').default;
    useWater.getState();
    require('@/store/meta').useMeta.setState({ meta: { ...require('@/store/meta').useMeta.getState().meta, suspectedMisses: 2 } });
    const ui = await render(themed(<Today />));
    expect(ui.texts()).toContain('Reminders arriving late?');
    await ui.press('Show me');
    expect(mockRouter.push).toHaveBeenCalledWith('/settings/battery-guide');
    expect(require('@/store/meta').useMeta.getState().meta.batteryGuideOffered).toBe(true);
    expect(ui.texts()).not.toContain('Reminders arriving late?');
  });
  it('can be dismissed for good', async () => {
    const Today = require('../../app/(tabs)/index').default;
    require('@/store/meta').useMeta.setState({ meta: { ...require('@/store/meta').useMeta.getState().meta, suspectedMisses: 3 } });
    const ui = await render(themed(<Today />));
    await ui.press('Not now');
    expect(ui.texts()).not.toContain('Reminders arriving late?');
  });
});

describe('Privacy', () => {
  it('shows the privacy choices row where the consent form requires it and opens it', async () => {
    const ui = await render(themed(<Privacy />));
    await ui.press('Privacy choices');
    expect(mockConsent.opened).toHaveBeenCalled();
  });
  it('hides the row where it is not required', async () => {
    mockConsent.required = false;
    const ui = await render(themed(<Privacy />));
    expect(ui.byLabel('Privacy choices')).toHaveLength(0);
    expect(ui.texts()).toContain('Your drinks, goal and settings stay on this phone. Sipling has no account and no server.');
  });
});

describe('Backup and restore', () => {
  it('exports every month to a file and opens the share sheet', async () => {
    useWater.getState().logDrink({ volumeMl: 250, ts: at(9) });
    useWater.getState().logDrink({ volumeMl: 300, ts: new Date(2026, 8, 20, 9).getTime() });
    useWater.setState({ months: {} }); // months that were never read are still exported
    const ui = await render(themed(<Backup />));
    await ui.press('Export a backup');
    expect(mockShare).toHaveBeenCalledWith('file:///cache/sipling-backup-2026-10-08.json', expect.objectContaining({ mimeType: 'application/json' }));
    const saved = JSON.parse(mockFiles.get('file:///cache/sipling-backup-2026-10-08.json')!);
    expect(saved.app).toBe('water-reminder');
    expect(Object.keys(saved.logs).sort()).toEqual(['2026-09', '2026-10']);
  });
  it('says so when exporting fails', async () => {
    mockShare.mockRejectedValueOnce(new Error('nope'));
    const ui = await render(themed(<Backup />));
    await ui.press('Export a backup');
    expect(ui.texts()).toContain('Could not create the backup. Please try again.');
  });
  it('round-trips: export, wipe, restore (after a confirmation)', async () => {
    useSettings.getState().setGoal({ goalMl: 2600, source: 'manual' });
    useWater.getState().logDrink({ volumeMl: 500, beverage: 'tea', ts: at(9, 6) });
    useWater.getState().setProgress({ streakFreezes: 1, activeSkin: 'sky' });
    const ui = await render(themed(<Backup />));
    await ui.press('Export a backup');
    mockPicker.result = mockFiles.get('file:///cache/sipling-backup-2026-10-08.json')!;

    resetApp(NOW);
    expect(useWater.getState().summaries).toEqual({});
    await ui.press('Restore from a backup');
    expect(ui.texts()).toContain('1 drinks on 1 days, 0 goal days');
    const alert = alertPress('destructive');
    await ui.press('Restore');
    alert.mockRestore();
    expect(ui.texts()).toContain('Restored. Welcome back!');
    expect(useSettings.getState().goal).toMatchObject({ goalMl: 2600, source: 'manual' });
    expect(useWater.getState().logsForDay('2026-10-06')[0]).toMatchObject({ beverage: 'tea', volumeMl: 500, effectiveMl: 450 });
    expect(useWater.getState().progress).toMatchObject({ streakFreezes: 1, activeSkin: 'sky' });
    expect(db.get('logs:2026-10')).toHaveLength(1);
  });
  it('does not celebrate a goal that the backup already reached', async () => {
    useWater.getState().logDrink({ volumeMl: 2000 });
    const ui = await render(themed(<Backup />));
    await ui.press('Export a backup');
    mockPicker.result = mockFiles.get('file:///cache/sipling-backup-2026-10-08.json')!;
    resetApp(NOW);
    await ui.press('Restore from a backup');
    const alert = alertPress('destructive');
    await ui.press('Restore');
    alert.mockRestore();
    expect(useSettings.getState().prefs.celebratedDay).toBe(TODAY);
    expect(useCelebration.getState().current).toBeNull();
  });
  it('closes finished days into the streak after a restore', async () => {
    useWater.getState().logDrink({ volumeMl: 2000, ts: at(9, 6) });
    useWater.getState().setProgress({ lastEvaluatedDay: '2026-10-05' });
    const ui = await render(themed(<Backup />));
    await ui.press('Export a backup');
    mockPicker.result = mockFiles.get('file:///cache/sipling-backup-2026-10-08.json')!;
    resetApp(NOW);
    await ui.press('Restore from a backup');
    const alert = alertPress('destructive');
    await ui.press('Restore');
    alert.mockRestore();
    expect(useWater.getState().progress).toMatchObject({ goalDays: 1, lastEvaluatedDay: '2026-10-07' });
  });
  it('keeps everything when the confirmation is cancelled', async () => {
    mockPicker.result = JSON.stringify({ app: 'water-reminder', schemaVersion: 1, logs: {}, daySummaries: {}, progress: {} });
    useWater.getState().logDrink({ volumeMl: 250 });
    const ui = await render(themed(<Backup />));
    await ui.press('Restore from a backup');
    const alert = alertPress('cancel');
    await ui.press('Restore');
    alert.mockRestore();
    expect(useWater.getState().summaries[TODAY].count).toBe(1);
  });
  it.each([
    ['not json at all', 'That file is damaged or is not a Sipling backup.'],
    [JSON.stringify({ app: 'habit-tracker', schemaVersion: 1 }), 'That file is not a Sipling backup.'],
    [JSON.stringify({ app: 'water-reminder', schemaVersion: 7 }), 'This backup is from a newer version. Update Sipling to import it.'],
  ])('rejects a bad file with a clear message (%#)', async (content, message) => {
    mockPicker.result = content;
    const ui = await render(themed(<Backup />));
    await ui.press('Restore from a backup');
    expect(ui.texts()).toContain(message);
    expect(ui.byLabel('Restore')).toHaveLength(0);
  });
  it('handles a cancelled picker quietly and a picker that fails', async () => {
    const ui = await render(themed(<Backup />));
    await ui.press('Restore from a backup');
    expect(ui.texts().some((t) => t.startsWith('Could not'))).toBe(false);
    mockPicker.result = 'throws';
    await ui.press('Restore from a backup');
    expect(ui.texts()).toContain('Could not read that file.');
  });
  it('can cancel the preview', async () => {
    mockPicker.result = JSON.stringify({ app: 'water-reminder', schemaVersion: 1, logs: {}, daySummaries: {}, progress: {} });
    const ui = await render(themed(<Backup />));
    await ui.press('Restore from a backup');
    expect(ui.texts()).toContain('Restore this backup?');
    await ui.press('Cancel');
    expect(ui.texts()).not.toContain('Restore this backup?');
  });
});

describe('accessibility', () => {
  it.each([1, 1.6])('every settings screen has labelled controls and 48dp targets at font scale %s', async (scale) => {
    mockNotif.granted = false;
    useWater.getState().setProgress({ streakFreezes: 1 });
    for (const el of [<Garden key="g" />, <SettingsIndex key="s" />, <GoalSettings key="o" />, <RemindersSettings key="r" />, <CupsSettings key="c" />, <BeveragesSettings key="b" />, <BatteryGuide key="bg" />, <Privacy key="p" />, <Backup key="bk" />]) {
      const ui = await render(themed(el, scale));
      expect(auditPressables(ui.root)).toEqual([]);
      await cleanup();
    }
  });
});

describe('dark mode', () => {
  afterEach(() => sharedStore.remove('theme.mode'));
  it('uses the dark palette on every main screen, with the same labelled controls', async () => {
    const Today = require('../../app/(tabs)/index').default;
    const History = require('../../app/(tabs)/history').default;
    useWater.getState().logDrink({ volumeMl: 250, ts: at(9) });
    for (const mode of ['light', 'dark'] as const) {
      sharedStore.set('theme.mode', mode);
      for (const el of [<Today key="t" />, <History key="h" />, <Garden key="g" />, <SettingsIndex key="s" />]) {
        const ui = await render(themed(el));
        const backgrounds = ui.root.findAll((n) => typeof n.props.style === 'object' && n.props.style !== null).map((n) => JSON.stringify(n.props.style));
        expect(backgrounds.some((b) => b.includes(mode === 'dark' ? '#0E1A24' : '#F4FAFE'))).toBe(true);
        expect(backgrounds.some((b) => b.includes(mode === 'dark' ? '#F4FAFE' : '#0E1A24'))).toBe(false);
        expect(auditPressables(ui.root)).toEqual([]);
        await cleanup();
      }
    }
  });
});
