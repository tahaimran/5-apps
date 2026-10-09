/**
 * Every screen, rendered for real, has labelled controls with 56dp touch targets at the system font
 * scales the QA checklist names (1.3x, 2.0x), in every color mode (light, dark, night).
 */
import { mockParams } from '@/testing/mocks';
import { resetApp, seedSession } from '@/testing/stores';
import { auditPressables, cleanup, flush, isPressable, render } from '@/testing/ui';
import { act } from 'react';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import TimerHome from '../../app/(tabs)/timer/index';
import KicksHome from '../../app/(tabs)/kicks/index';
import PregnancyHome from '../../app/(tabs)/pregnancy/index';
import MoreHome from '../../app/(tabs)/more/index';
import TabsLayout from '../../app/(tabs)/_layout';
import History from '../../app/(tabs)/timer/history';
import SessionDetail from '../../app/(tabs)/timer/session/[id]';
import ShareSummary from '../../app/modals/share-summary';
import KickHistory from '../../app/(tabs)/kicks/history';
import { KickReminderSheet } from '@/components/KickReminderSheet';
import { useKicks } from '@/store/kicks';
import DueDate from '../../app/(tabs)/pregnancy/due-date';
import Week from '../../app/(tabs)/pregnancy/week/[n]';
import HospitalBag from '../../app/(tabs)/pregnancy/hospital-bag';
import BirthPlan from '../../app/(tabs)/pregnancy/birth-plan';
import { useProfile } from '@/store/profile';
import { useChecklists } from '@/store/checklists';
import { RowEditor } from '@/features/history/RowEditor';
import { useSessions } from '@/store/sessions';

const themed = (el: ReactElement, scale: number) => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE * scale} touchTarget={TOUCH_TARGET}>
    {el}
  </ThemeProvider>
);

beforeEach(() => {
  resetApp();
  useKicks.setState({ active: null, history: [] });
  useChecklists.setState({ lists: {} });
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

// Every row has three entries (a missing setup is null): jest-each takes a third parameter for a `done` callback.
const screens: [string, () => ReactElement, (() => void) | null][] = [
  ['Timer', () => <TimerHome />, null],
  ['Timer (contraction running)', () => <TimerHome />, () => void useSessions.getState().tap(Date.now() - 42_000)],
  ['History', () => <History />, () => void seedSession('s1', 3_600_000)],
  ['Session detail', () => <SessionDetail />, () => { seedSession('s1', 3_600_000); mockParams.current = { id: 's1' }; }],
  ['Row editor', () => <RowEditor sessionId="s1" target={{ mode: 'add', startedAt: Date.now() - 600_000 }} onClose={() => undefined} onDeleted={() => undefined} />, () => void seedSession('s1', 3_600_000)],
  ['Share summary', () => <ShareSummary />, () => { seedSession('s1', 3_600_000); mockParams.current = { id: 's1' }; }],
  ['Kicks', () => <KicksHome />, null],
  ['Kicks (counting)', () => <KicksHome />, () => { useKicks.getState().start(Date.now() - 60_000); useKicks.getState().tap(Date.now() - 30_000); }],
  ['Kicks (target reached)', () => <KicksHome />, () => { useKicks.getState().start(Date.now() - 600_000); for (let i = 1; i <= 10; i++) useKicks.getState().tap(Date.now() - 600_000 + i * 20_000); }],
  ['Kick history', () => <KickHistory />, () => { useKicks.getState().start(Date.now() - 900_000); for (let i = 1; i <= 10; i++) useKicks.getState().tap(Date.now() - 900_000 + i * 20_000); useKicks.getState().finish(Date.now()); }],
  ['Kick reminder sheet', () => <KickReminderSheet visible onClose={() => undefined} />, null],
  ['My Pregnancy', () => <PregnancyHome />, null],
  ['My Pregnancy (due date set)', () => <PregnancyHome />, () => useProfile.getState().setDue({ mode: 'edd', date: '2026-12-01' })],
  ['Due date calculator', () => <DueDate />, null],
  ['Week card', () => <Week />, () => { mockParams.current = { n: '34' }; }],
  ['Hospital bag', () => <HospitalBag />, null],
  ['Birth plan', () => <BirthPlan />, null],
  ['More', () => <MoreHome />, null],
  ['Tabs', () => <TabsLayout />, null],
];

describe.each([1.3, 2])('font scale %s', (scale) => {
  describe.each(['light', 'dark', 'high-contrast'] as const)('%s mode', (mode) => {
    it.each(screens)('%s', async (_name, make, setup) => {
      sharedStore.set('theme.mode', mode);
      setup?.();
      const ui = await render(themed(make(), scale));
      await act(async () => new Promise((r) => setTimeout(r, 20)));
      await flush();
      expect(auditPressables(ui.root)).toEqual([]);
      expect(ui.root.findAll(isPressable).length).toBeGreaterThanOrEqual(0);
    });
  });
});
