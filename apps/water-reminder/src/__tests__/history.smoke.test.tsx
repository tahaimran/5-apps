import { mockParams, mockRouter, resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, render } from '@/testing/ui';
import { Alert } from 'react-native';
import { act } from 'react';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { ReactElement } from 'react';

const mockShowInterstitial = jest.fn(async (_p: string) => true);
jest.mock('@shared/ads', () => ({
  ...jest.requireActual('@shared/ads'),
  NativeAdCard: ({ placement }: { placement: string }) => require('react').createElement(require('react-native').Text, null, `AD:${placement}`),
  showInterstitial: (p: string) => mockShowInterstitial(p),
}));

import History from '../../app/(tabs)/history';
import EditEntry from '../../app/edit-entry/[id]';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { palette } from '@/theme/tokens';

const TODAY = '2026-10-08';
const themed = (el: ReactElement, scale = 1) => <ThemeProvider palette={palette} fontScale={scale}>{el}</ThemeProvider>;
const at = (h: number, mi = 0, d = 8) => new Date(2026, 9, d, h, mi).getTime();
const log = (ml: number, h: number, extra: Partial<Parameters<ReturnType<typeof useWater.getState>['logDrink']>[0]> = {}, d = 8) =>
  useWater.getState().logDrink({ volumeMl: ml, ts: at(h, 0, d), ...extra });

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 14, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(new Date(2026, 9, 8, 14, 0, 0));
  resetNotifMock();
  sharedStore.set('onboarding.completedAt', Date.now());
  mockParams.current = {};
  mockShowInterstitial.mockClear();
  mockShowInterstitial.mockResolvedValue(true);
  for (const fn of Object.values(mockRouter)) if (typeof fn === 'function' && 'mockClear' in fn) (fn as jest.Mock).mockClear();
  useToday.setState({ today: TODAY });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('History: Day', () => {
  it('shows an empty day without an ad', async () => {
    const ui = await render(themed(<History />));
    expect(ui.texts()).toContain('Today');
    expect(ui.texts()).toContain('No drinks logged this day');
    expect(ui.texts()).toContain('0 ml of 2,000 ml');
    expect(ui.texts().some((t) => t.startsWith('AD:'))).toBe(false);
  });
  it('lists the entries with times and counted amounts, and the total', async () => {
    log(250, 8);
    log(250, 10, { beverage: 'coffee' });
    const ui = await render(themed(<History />));
    expect(ui.texts()).toContain('450 ml of 2,000 ml');
    expect(ui.byLabel('Edit 8:00 AM, Water, 250 millilitres')).toHaveLength(1);
    expect(ui.byLabel('Edit 10:00 AM, Coffee, 250 millilitres')).toHaveLength(1);
    expect(ui.texts()).toContain('counts as 200 ml');
  });
  it('puts the native ad after the 3rd row, or at the end of a short list', async () => {
    log(100, 7);
    log(100, 8);
    let ui = await render(themed(<History />));
    expect(ui.texts().filter((t) => t === 'AD:history_list')).toHaveLength(1);
    await cleanup();
    log(100, 9);
    log(100, 10);
    ui = await render(themed(<History />));
    const texts = ui.texts();
    expect(texts.filter((t) => t === 'AD:history_list')).toHaveLength(1);
    expect(texts.indexOf('AD:history_list')).toBeGreaterThan(texts.indexOf('7:00 AM') + 4);
    expect(texts.indexOf('AD:history_list')).toBeLessThan(texts.findIndex((t) => t === '10:00 AM'));
  });
  it('opens an entry for editing', async () => {
    const { entry } = log(250, 8);
    const ui = await render(themed(<History />));
    await ui.press('Edit 8:00 AM, Water, 250 millilitres');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/edit-entry/[id]', params: { id: entry.id } });
  });
  it('deletes an entry after a confirmation', async () => {
    log(250, 8);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => void buttons?.find((b) => b.style === 'destructive')?.onPress?.());
    const ui = await render(themed(<History />));
    await ui.press('Delete the drink at 8:00 AM');
    expect(alert).toHaveBeenCalledWith('Delete this drink?', '250 ml will be removed from your day.', expect.any(Array));
    expect(useWater.getState().summaries[TODAY]).toBeUndefined();
    expect(ui.texts()).toContain('No drinks logged this day');
    alert.mockRestore();
  });
  it('keeps the entry when the confirmation is cancelled', async () => {
    log(250, 8);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => void buttons?.find((b) => b.style === 'cancel')?.onPress?.());
    const ui = await render(themed(<History />));
    await ui.press('Delete the drink at 8:00 AM');
    expect(useWater.getState().summaries[TODAY].count).toBe(1);
    alert.mockRestore();
  });
  it('pages back through days but not into the future', async () => {
    log(500, 9, {}, 7);
    const ui = await render(themed(<History />));
    expect(ui.byLabel('Next day').some((n) => n.props.accessibilityState?.disabled)).toBe(true);
    await ui.press('Previous day');
    expect(ui.texts()).toContain('Yesterday');
    expect(ui.texts()).toContain('500 ml of 2,000 ml');
    await ui.press('Previous day');
    expect(ui.texts()).toContain('Tue, Oct 6');
    await ui.press('Next day');
    await ui.press('Next day');
    expect(ui.texts()).toContain('Today');
  });
  it('shows streaks', async () => {
    useWater.getState().setProgress({ streak: 4, bestStreak: 9 });
    const ui = await render(themed(<History />));
    expect(ui.byLabel('Streak: 4 days')).toHaveLength(1);
    expect(ui.byLabel('Best streak: 9 days')).toHaveLength(1);
  });
});

describe('History: Week and Month', () => {
  beforeEach(() => {
    log(2300, 9, {}, 6);
    log(1500, 9, {}, 7);
    log(800, 9, {}, 8);
  });
  it('draws the last 7 days with their amounts, marks reached days and shows stats', async () => {
    const ui = await render(themed(<History />));
    await ui.press('Week');
    expect(ui.texts()).toContain('Fri, Oct 2 – Thu, Oct 8');
    expect(ui.byLabel('Tuesday, Oct 6: 2,300 millilitres, goal reached')).toHaveLength(1);
    expect(ui.byLabel('Wednesday, Oct 7: 1,500 millilitres')).toHaveLength(1);
    expect(ui.texts()).toContain('Average');
    expect(ui.texts()).toContain('1 of 7');
    expect(ui.texts()).toContain('Dashed line: your goal, 2,000 ml');
    expect(ui.texts().filter((t) => t === 'AD:history_list')).toHaveLength(1);
  });
  it('pages by week but not past today', async () => {
    const ui = await render(themed(<History />));
    await ui.press('Week');
    await ui.press('Previous week');
    expect(ui.texts()).toContain('Fri, Sep 25 – Thu, Oct 1');
    expect(ui.texts()).not.toContain('AD:history_list'); // nothing logged that week
    await ui.press('Next week');
    expect(ui.texts()).toContain('Fri, Oct 2 – Thu, Oct 8');
  });
  it('gives the month chart one spoken summary instead of 31 stops', async () => {
    const ui = await render(themed(<History />));
    await ui.press('Month');
    expect(ui.texts()).toContain('October 2026');
    const summary = ui.byLabel(/^October 2026 chart/)[0];
    expect(summary.props.accessibilityLabel).toBe('October 2026 chart. Average 575 millilitres, best day Tuesday, Oct 6, 2,300 millilitres, goal reached on 1 of 8 days');
    expect(ui.byLabel(/^\w+day, \w+ \d+: .*goal reached$/)).toHaveLength(0);
    await ui.press('Previous month');
    expect(ui.texts()).toContain('September 2026');
    expect(ui.texts()).toContain('None yet');
  });
  it('shows volumes in fl oz', async () => {
    useSettings.getState().setGoal({ unit: 'floz' });
    const ui = await render(themed(<History />));
    await ui.press('Week');
    expect(ui.byLabel('Tuesday, Oct 6: 77.8 fluid ounces, goal reached')).toHaveLength(1);
  });
});

describe('interstitial when leaving History (plan §12)', () => {
  it('is requested after 20 seconds on the screen, and counted when shown', async () => {
    const ui = await render(themed(<History />));
    jest.setSystemTime(new Date(2026, 9, 8, 14, 0, 25));
    await act(async () => ui.unmount());
    expect(mockShowInterstitial).toHaveBeenCalledWith('history_exit');
    await act(async () => void 0);
    expect(useSettings.getState().prefs.fullScreenToday).toEqual({ day: TODAY, count: 1 });
  });
  it('is not requested after a short visit', async () => {
    const ui = await render(themed(<History />));
    jest.setSystemTime(new Date(2026, 9, 8, 14, 0, 10));
    await act(async () => ui.unmount());
    expect(mockShowInterstitial).not.toHaveBeenCalled();
  });
  it('is not counted when the ad was skipped', async () => {
    mockShowInterstitial.mockResolvedValue(false);
    const ui = await render(themed(<History />));
    jest.setSystemTime(new Date(2026, 9, 8, 14, 1, 0));
    await act(async () => ui.unmount());
    await act(async () => void 0);
    expect(useSettings.getState().prefs.fullScreenToday).toBeUndefined();
  });
});

describe('Edit entry', () => {
  it('changes the drink, amount and time', async () => {
    const { entry } = log(250, 8);
    mockParams.current = { id: entry.id };
    const ui = await render(themed(<EditEntry />));
    await ui.press('Tea');
    await ui.type('Amount in ml', '400');
    await ui.press('Later'); // 08:00 → 09:00
    await ui.press('Save');
    const saved = useWater.getState().logsForDay(TODAY)[0];
    expect(saved).toMatchObject({ beverage: 'tea', volumeMl: 400, effectiveMl: 360 });
    expect(new Date(saved.ts).getHours()).toBe(9);
    expect(mockRouter.back).toHaveBeenCalled();
  });
  it('keeps the original time when only the amount changes', async () => {
    const { entry } = useWater.getState().logDrink({ volumeMl: 250, ts: at(8, 7) });
    mockParams.current = { id: entry.id };
    const ui = await render(themed(<EditEntry />));
    await ui.type('Amount in ml', '300');
    await ui.press('Save');
    expect(useWater.getState().logsForDay(TODAY)[0]).toMatchObject({ volumeMl: 300, ts: at(8, 7) });
  });
  it('deletes after a confirmation', async () => {
    const { entry } = log(250, 8);
    mockParams.current = { id: entry.id };
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => void buttons?.find((b) => b.style === 'destructive')?.onPress?.());
    const ui = await render(themed(<EditEntry />));
    await ui.press('Delete this drink');
    expect(useWater.getState().logsForDay(TODAY)).toHaveLength(0);
    expect(mockRouter.back).toHaveBeenCalled();
    alert.mockRestore();
  });
  it('says so when the drink no longer exists', async () => {
    mockParams.current = { id: '2026-10-08_gone' };
    const ui = await render(themed(<EditEntry />));
    expect(ui.texts()).toContain('This drink was not found. It may have been deleted.');
    await ui.press('Back');
    expect(mockRouter.back).toHaveBeenCalled();
  });
  it('re-files a drink moved to the previous night', async () => {
    const { entry } = log(250, 3); // 03:00 belongs to yesterday (wake 07:00)
    mockParams.current = { id: entry.id };
    expect(entry.dayKey).toBe('2026-10-07');
    const ui = await render(themed(<EditEntry />));
    await ui.press('Save');
    expect(useWater.getState().logsForDay('2026-10-07')).toHaveLength(1);
  });
});

describe('accessibility', () => {
  it.each([1, 1.6])('labels every control and keeps 48dp targets at font scale %s', async (scale) => {
    log(250, 8);
    log(300, 9);
    const ui = await render(themed(<History />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('Week');
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('Month');
    expect(auditPressables(ui.root)).toEqual([]);
    const { entry } = log(250, 10);
    mockParams.current = { id: entry.id };
    const edit = await render(themed(<EditEntry />, scale));
    expect(auditPressables(edit.root)).toEqual([]);
  });
});
