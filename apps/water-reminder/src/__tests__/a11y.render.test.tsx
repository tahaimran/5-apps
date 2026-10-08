/**
 * Plan §7.5 and §18: every screen, rendered for real, has labelled controls with 48dp touch
 * targets at the system font scales the QA checklist names (1.3x, 2.0x) and in both color modes.
 */
import { mockNotif, mockParams, resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, isPressable, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { ReactElement } from 'react';
import Today from '../../app/(tabs)/index';
import History from '../../app/(tabs)/history';
import Garden from '../../app/(tabs)/garden';
import LogCustom from '../../app/log-custom';
import EditEntry from '../../app/edit-entry/[id]';
import Onboarding from '../../app/onboarding';
import SettingsIndex from '../../app/settings/index';
import GoalSettings from '../../app/settings/goal';
import RemindersSettings from '../../app/settings/reminders';
import CupsSettings from '../../app/settings/cups';
import BeveragesSettings from '../../app/settings/beverages';
import BatteryGuide from '../../app/settings/battery-guide';
import Privacy from '../../app/settings/privacy';
import Backup from '../../app/settings/backup';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { palette } from '@/theme/tokens';

const NOW = new Date(2026, 9, 8, 14, 0);
const themed = (el: ReactElement, scale: number) => <ThemeProvider palette={palette} fontScale={scale}>{el}</ThemeProvider>;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  resetNotifMock();
  mockNotif.granted = false; // the reminders-off card is part of Today
  sharedStore.set('onboarding.completedAt', 1);
  useToday.setState({ today: '2026-10-08' });
  useMeta.setState({ meta: { ...useMeta.getState().meta, suspectedMisses: 2 } }); // the late-reminder card too
  const w = useWater.getState();
  for (const [h, ml, beverage] of [[8, 250, 'water'], [10, 300, 'coffee'], [12, 250, 'tea']] as const) w.logDrink({ volumeMl: ml, beverage, ts: new Date(2026, 9, 8, h).getTime() });
  w.setProgress({ streak: 4, bestStreak: 9, streakFreezes: 1, goalDays: 12, stage: 3 });
  useSettings.getState().setReminders({ quietBlocks: [{ startMin: 720, endMin: 780 }] });
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
  jest.useRealTimers();
});

const entryId = () => useWater.getState().logsForDay('2026-10-08')[0].id;

const screens: [string, () => ReactElement][] = [
  ['Today', () => <Today />],
  ['History', () => <History />],
  ['Garden', () => <Garden />],
  ['Log a drink', () => <LogCustom />],
  ['Edit a drink', () => {
    mockParams.current = { id: entryId() };
    return <EditEntry />;
  }],
  ['Onboarding', () => <Onboarding />],
  ['Settings', () => <SettingsIndex />],
  ['Goal', () => <GoalSettings />],
  ['Reminders', () => <RemindersSettings />],
  ['Cups', () => <CupsSettings />],
  ['Drinks', () => <BeveragesSettings />],
  ['Battery guide', () => <BatteryGuide />],
  ['Privacy', () => <Privacy />],
  ['Backup', () => <Backup />],
];

describe.each([1.3, 2])('font scale %s', (scale) => {
  describe.each(['light', 'dark'] as const)('%s mode', (mode) => {
    it.each(screens)('%s', async (_name, make) => {
      sharedStore.set('theme.mode', mode);
      const ui = await render(themed(make(), scale));
      // The audit sees real buttons (Privacy has none where no consent form is required).
      if (_name !== 'Privacy') expect(ui.root.findAll(isPressable).length).toBeGreaterThan(0);
      expect(auditPressables(ui.root)).toEqual([]);
    });
  });
});

describe('the history charts and week pager', () => {
  it.each([1.3, 2])('stay accessible at font scale %s', async (scale) => {
    const ui = await render(themed(<History />, scale));
    for (const mode of ['Week', 'Month']) {
      await ui.press(mode);
      expect(auditPressables(ui.root)).toEqual([]);
    }
  });
});
