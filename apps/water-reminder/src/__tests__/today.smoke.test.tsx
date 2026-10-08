import { mockNotif, mockRouter, resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Alert, Linking } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { ReactElement } from 'react';
import Today from '../../app/(tabs)/index';
import LogCustom, { parseAmount } from '../../app/log-custom';
import { resetAdGuardState } from '@/ads/guard';
import { useCelebration } from '@/store/celebrations';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { palette } from '@/theme/tokens';
import { Slider } from '@/ui/Slider';

const TODAY = '2026-10-08';
const themed = (el: ReactElement, scale = 1) => <ThemeProvider palette={palette} fontScale={scale}>{el}</ThemeProvider>;
const at = (h: number, mi = 0) => new Date(2026, 9, 8, h, mi).getTime();

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 14, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(new Date(2026, 9, 8, 14, 0, 0));
  resetNotifMock();
  resetAdGuardState();
  sharedStore.set('onboarding.completedAt', Date.now());
  for (const fn of Object.values(mockRouter)) if (typeof fn === 'function' && 'mockClear' in fn) (fn as jest.Mock).mockClear();
  useCelebration.setState({ current: null });
  useToday.setState({ today: TODAY });
  mockNotif.granted = true;
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

const summary = () => useWater.getState().summaries[TODAY];
/** A store change that happens while the screen is mounted (e.g. from a notification). */
const outside = (fn: () => void) => act(async () => void fn());

describe('Today: empty state', () => {
  it('shows the date, an empty ring, the quick-add chips and the first-sip note', async () => {
    const ui = await render(themed(<Today />));
    expect(ui.texts()).toContain('Thu, Oct 8');
    expect(ui.texts()).toContain('Your plant is waiting for its first sip.');
    expect(ui.texts().join('|')).toContain('0 / 2,000 ml · 0%');
    for (const ml of ['150', '250', '350', '500']) expect(ui.byLabel(`Add ${ml} millilitres`)).toHaveLength(1);
    expect(ui.byLabel('Add a different amount or drink')).toHaveLength(1);
    expect(ui.byLabel('Settings')).toHaveLength(1);
    expect(ui.byLabel(/^Your plant is a seed and looks thirsty/)).toHaveLength(1);
    expect(ui.texts()).not.toContain("Today's log");
  });
  it('describes the ring for a screen reader', async () => {
    const ui = await render(themed(<Today />));
    const ring = ui.root.findAll((n) => n.props.accessibilityRole === 'progressbar')[0];
    expect(ring.props.accessibilityLabel).toBe('0 millilitres of 2,000 millilitres, 0 percent');
    expect(ring.props.accessibilityValue).toMatchObject({ min: 0, max: 100, now: 0 });
  });
  it('opens settings and the custom amount sheet', async () => {
    const ui = await render(themed(<Today />));
    await ui.press('Settings');
    expect(mockRouter.push).toHaveBeenCalledWith('/settings');
    await ui.press('Add a different amount or drink');
    expect(mockRouter.push).toHaveBeenCalledWith('/log-custom');
  });
});

describe('Today: logging (F2)', () => {
  it('logs a cup with one tap and shows an undo for 5 seconds', async () => {
    const ui = await render(themed(<Today />));
    await ui.press('Add 250 millilitres');
    expect(summary()).toMatchObject({ effectiveMl: 250, count: 1 });
    expect(ui.texts()).toContain('Added 250 ml');
    expect(ui.texts().join('|')).toContain('250 / 2,000 ml · 13%');
    expect(ui.texts()).toContain("Today's log");
    expect(ui.byLabel(/^Your plant is a seed and looks thirsty/)).toHaveLength(1);
    await act(async () => {
      jest.advanceTimersByTime(5100);
    });
    expect(ui.texts()).not.toContain('Added 250 ml');
    expect(summary().count).toBe(1); // the log stays
  });
  it('undoes the last drink', async () => {
    const ui = await render(themed(<Today />));
    await ui.press('Add 500 millilitres');
    await ui.press('Undo');
    expect(summary()).toBeUndefined();
    expect(ui.texts()).not.toContain('Added 500 ml');
  });
  it('shows the last 3 entries, newest first, with the counted amount for a coffee', async () => {
    const w = useWater.getState();
    w.logDrink({ volumeMl: 100, ts: at(8) });
    w.logDrink({ volumeMl: 200, ts: at(9) });
    w.logDrink({ volumeMl: 250, beverage: 'coffee', ts: at(10) });
    w.logDrink({ volumeMl: 300, ts: at(11) });
    const ui = await render(themed(<Today />));
    const rows = ui.byLabel(/^\d+:\d+ [AP]M, /);
    expect(rows.map((r) => r.props.accessibilityLabel.split(', ').slice(1).join(', '))).toEqual(['Water, 300 millilitres', 'Coffee, 250 millilitres', 'Water, 200 millilitres']);
    expect(ui.texts()).toContain('counts as 200 ml');
    await ui.press('See all');
    expect(mockRouter.push).toHaveBeenCalledWith('/history');
  });
  it('shows volumes in fluid ounces when that is the unit', async () => {
    useSettings.getState().setGoal({ unit: 'floz' });
    const ui = await render(themed(<Today />));
    expect(ui.byLabel('Add 8.5 fluid ounces')).toHaveLength(1);
    await ui.press('Add 8.5 fluid ounces');
    expect(ui.texts().join('|')).toContain('8.5 / 67.6 fl oz');
  });
  it('fills the ring and the plant mood as the day goes on', async () => {
    useWater.getState().logDrink({ volumeMl: 1000, ts: at(10) });
    const ui = await render(themed(<Today />));
    expect(ui.texts().join('|')).toContain('1,000 / 2,000 ml · 50%');
    expect(ui.byLabel(/looks okay$/)).toHaveLength(1);
    await ui.press('Add 500 millilitres');
    expect(ui.byLabel(/looks happy$/)).toHaveLength(1); // 75%
  });
});

describe('Today: goal reached (F3)', () => {
  it('turns on the reached state, celebrates once, and says so', async () => {
    useWater.getState().logDrink({ volumeMl: 1500, ts: at(10) });
    const ui = await render(themed(<Today />));
    await ui.press('Add 500 millilitres');
    expect(summary().reached).toBe(true);
    expect(ui.texts()).toContain('Goal reached! Your plant is blooming.');
    expect(useCelebration.getState().current).toMatchObject({ kind: 'goal' });
    expect(useSettings.getState().prefs.celebratedDay).toBe(TODAY);
    expect(ui.byLabel(/looks sparkling with joy$/)).toHaveLength(1);
  });
  it('does not celebrate again after undo and add, or when opening with the goal already reached', async () => {
    const ui = await render(themed(<Today />));
    await ui.press('Add 500 millilitres');
    await outside(() => useWater.getState().logDrink({ volumeMl: 1500 }));
    expect(useCelebration.getState().current).not.toBeNull();
    act(() => useCelebration.getState().dismiss());
    await ui.press('Undo');
    await outside(() => useWater.getState().logDrink({ volumeMl: 2000 }));
    expect(useCelebration.getState().current).toBeNull();
    await cleanup();
    const again = await render(themed(<Today />));
    expect(useCelebration.getState().current).toBeNull();
    expect(again.texts().join('|')).toContain('3,500 / 2,000 ml · 175%');
  });
  it('lifts the streak and goal days the moment the goal is reached', async () => {
    useWater.getState().setProgress({ streak: 5, bestStreak: 5, goalDays: 9, stage: 2 });
    const ui = await render(themed(<Today />));
    expect(ui.byLabel('5 day streak')).toHaveLength(1);
    await ui.press('Add 500 millilitres');
    await outside(() => useWater.getState().logDrink({ volumeMl: 1500 }));
    expect(ui.byLabel('6 day streak')).toHaveLength(1);
    expect(ui.byLabel(/^Your plant is a young plant/)).toHaveLength(1); // 10th goal day
  });
  it('says there is no need to overdo it past 150%', async () => {
    useWater.getState().logDrink({ volumeMl: 3100, ts: at(10) });
    const ui = await render(themed(<Today />));
    expect(ui.texts()).toContain('Great job! No need to overdo it.');
  });
  it('hides the streak chip when there is no streak', async () => {
    const ui = await render(themed(<Today />));
    expect(ui.byLabel(/day streak/)).toHaveLength(0);
  });
});

describe('Today: reminders card (plan §5.1)', () => {
  it('asks to turn reminders on when the permission is off, and refreshes after', async () => {
    mockNotif.granted = false;
    // The explanation dialog comes first; the user taps "Allow".
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => void buttons?.[1].onPress?.());
    const ui = await render(themed(<Today />));
    expect(ui.texts()).toContain('Reminders are off');
    await ui.press('Turn on');
    await flush();
    expect(alert).toHaveBeenCalledWith('Turn on reminders?', expect.stringContaining('gentle nudge'), expect.anything(), expect.anything());
    alert.mockRestore();
    expect(mockNotif.granted).toBe(true);
    expect(ui.texts()).not.toContain('Reminders are off');
  });
  it('opens system settings when the permission was refused for good', async () => {
    mockNotif.granted = false;
    mockNotif.canAskAgain = false;
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const ui = await render(themed(<Today />));
    await ui.press('Open settings');
    expect(open).toHaveBeenCalled();
    open.mockRestore();
  });
  it('is not shown when the user turned reminders off in Settings, or when they are allowed', async () => {
    useSettings.getState().setReminders({ enabled: false });
    mockNotif.granted = false;
    expect((await render(themed(<Today />))).texts()).not.toContain('Reminders are off');
    await cleanup();
    useSettings.getState().setReminders({ enabled: true });
    mockNotif.granted = true;
    expect((await render(themed(<Today />))).texts()).not.toContain('Reminders are off');
  });
  it('shows the next reminder time, skipping what a recent drink already covers', async () => {
    const ui = await render(themed(<Today />));
    expect(ui.texts().some((t) => /^Next reminder 3:\d\d PM$/.test(t) || /^Next reminder \d+:\d\d (AM|PM)$/.test(t))).toBe(true);
  });
  it('moves the next reminder forward as the day passes, without any other change', async () => {
    useSettings.getState().setGoal({ goalMl: 2300 });
    const ui = await render(themed(<Today />));
    expect(ui.texts()).toContain('Next reminder 2:10 PM');
    await act(async () => {
      jest.setSystemTime(new Date(2026, 9, 8, 14, 20));
      jest.advanceTimersByTime(60_000);
    });
    expect(ui.texts()).toContain('Next reminder 3:50 PM');
  });
  it('says "tomorrow" once the goal is reached', async () => {
    useWater.getState().logDrink({ volumeMl: 2000, ts: at(12) });
    const ui = await render(themed(<Today />));
    expect(ui.texts().some((t) => t.startsWith('Next reminder tomorrow, '))).toBe(true);
  });
});

describe('Today: a streak freeze notice', () => {
  it('shows a toast when a freeze kept the streak alive while away', async () => {
    useWater.setState({ freezeNotice: 1 });
    await render(themed(<Today />));
    expect(useCelebration.getState().current).toMatchObject({ kind: 'freezeUsed', count: 1 });
    expect(useWater.getState().freezeNotice).toBe(0);
  });
});

describe('Log a custom drink (plan §5.4)', () => {
  it('logs coffee with the counted amount and goes back', async () => {
    const ui = await render(themed(<LogCustom />));
    await ui.press('Coffee');
    await ui.type('Amount in ml', '300');
    expect(ui.texts()).toContain('Coffee 300 ml → counts as 240 ml');
    await ui.press('Add');
    const log = useWater.getState().logsForDay(TODAY)[0];
    expect(log).toMatchObject({ beverage: 'coffee', volumeMl: 300, effectiveMl: 240, source: 'app' });
    expect(mockRouter.back).toHaveBeenCalled();
  });
  it('defaults to 250 ml of water now, and can use a time earlier today', async () => {
    const ui = await render(themed(<LogCustom />));
    await ui.press('Earlier'); // hour -1 → 13:00
    await ui.press('Add');
    expect(new Date(useWater.getState().logsForDay(TODAY)[0].ts).getHours()).toBe(13);
    expect(useWater.getState().logsForDay(TODAY)[0]).toMatchObject({ beverage: 'water', volumeMl: 250 });
  });
  it('treats a later time of day as last night', async () => {
    const ui = await render(themed(<LogCustom />));
    for (let i = 0; i < 9; i++) await ui.press('Later'); // 14:00 → 23:00
    await ui.press('Add');
    expect(useWater.getState().logsForDay('2026-10-07')).toHaveLength(1);
  });
  it('keeps the typed amount within 50 to 1,000 ml and ignores nonsense', async () => {
    const ui = await render(themed(<LogCustom />));
    await ui.type('Amount in ml', '5000');
    await ui.press('Add');
    expect(useWater.getState().logsForDay(TODAY)[0].volumeMl).toBe(1000);
    expect(parseAmount('abc', 'ml')).toBeNull();
    expect(parseAmount('0', 'ml')).toBeNull();
    expect(parseAmount('8,5', 'floz')).toBe(251);
  });
  it('types ounces when the unit is fl oz', async () => {
    useSettings.getState().setGoal({ unit: 'floz' });
    const ui = await render(themed(<LogCustom />));
    await ui.type('Amount in fl oz', '12');
    await ui.press('Add');
    expect(useWater.getState().logsForDay(TODAY)[0].volumeMl).toBe(355);
  });
  it('has a slider that screen readers can adjust', async () => {
    const ui = await render(themed(<LogCustom />));
    const slider = ui.root.findAll((n) => n.props.accessibilityRole === 'adjustable')[0];
    expect(slider.props.accessibilityValue).toMatchObject({ min: 50, max: 1000, now: 250, text: '250 millilitres' });
    await act(async () => slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
    expect(ui.texts()).toContain('260 ml');
    await act(async () => slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }));
    await act(async () => slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }));
    expect(ui.texts()).toContain('240 ml');
  });
});

describe('Slider', () => {
  const touch = (x: number) => ({ nativeEvent: { locationX: x } }) as never;
  it('maps a touch position to a snapped value', async () => {
    const onChange = jest.fn();
    const ui = await render(themed(<Slider value={50} min={50} max={1000} step={10} onChange={onChange} label="Amount" />));
    const node = ui.root.findAll((n) => n.props.accessibilityRole === 'adjustable')[0];
    await act(async () => node.props.onLayout({ nativeEvent: { layout: { width: 200 } } }));
    await act(async () => node.props.onResponderGrant(touch(100)));
    expect(onChange).toHaveBeenLastCalledWith(530);
    await act(async () => node.props.onResponderMove(touch(400)));
    expect(onChange).toHaveBeenLastCalledWith(1000);
    await act(async () => node.props.onResponderMove(touch(-20)));
    expect(onChange).toHaveBeenLastCalledWith(50);
  });
  it('ignores touches before it was laid out and other actions', async () => {
    const onChange = jest.fn();
    const ui = await render(themed(<Slider value={100} min={50} max={1000} step={10} onChange={onChange} label="Amount" />));
    const node = ui.root.findAll((n) => n.props.accessibilityRole === 'adjustable')[0];
    await act(async () => node.props.onResponderGrant(touch(50)));
    await act(async () => node.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('accessibility', () => {
  it.each([1, 1.6])('labels every control and keeps 48dp targets at font scale %s', async (scale) => {
    useWater.getState().logDrink({ volumeMl: 250, beverage: 'tea', ts: at(9) });
    mockNotif.granted = false;
    const today = await render(themed(<Today />, scale));
    await ui_press(today, 'Add 250 millilitres');
    expect(auditPressables(today.root)).toEqual([]);
    const custom = await render(themed(<LogCustom />, scale));
    expect(auditPressables(custom.root)).toEqual([]);
  });
  it('gives the quick-add chips a 56dp height', async () => {
    const ui = await render(themed(<Today />));
    const { StyleSheet } = require('react-native');
    const chip = ui.root.findAll((n) => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === 'Add 250 millilitres')[0];
    expect(StyleSheet.flatten(chip.props.style).minHeight).toBeGreaterThanOrEqual(56);
  });
});

async function ui_press(ui: Awaited<ReturnType<typeof render>>, label: string) {
  await ui.press(label);
}
