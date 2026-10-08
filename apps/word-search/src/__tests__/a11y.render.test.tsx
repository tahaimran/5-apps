/**
 * Plan §7.5 and §17: every screen, rendered for real, has labelled controls with 56dp touch
 * targets at the system font scales the QA checklist names (1.3x, 2.0x), in every color mode and
 * at every text size.
 */
import { mockParams } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, flush, isPressable, render } from '@/testing/ui';
import { act } from 'react';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import Home from '../../app/(tabs)/index';
import Daily from '../../app/(tabs)/daily';
import SettingsTab from '../../app/(tabs)/settings';
import TabsLayout from '../../app/(tabs)/_layout';
import Play from '../../app/play/[puzzleId]';
import { useSettings } from '@/store/settings';
import { fontScaleFor, palette, TEXT_SIZES, TOUCH_TARGET } from '@/theme/tokens';

const themed = (el: ReactElement, scale: number) => <ThemeProvider palette={palette} fontScale={scale} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;

beforeEach(() => {
  resetApp();
  mockParams.current = { puzzleId: 'animals:easy:1' };
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

const screens: [string, () => ReactElement, boolean][] = [
  ['Home', () => <Home />, false],
  ['Daily', () => <Daily />, false],
  ['Settings', () => <SettingsTab />, false],
  ['Tabs', () => <TabsLayout />, false],
  ['Play', () => <Play />, true],
];

describe.each([1.3, 2])('font scale %s', (scale) => {
  describe.each(['light', 'dark', 'high-contrast'] as const)('%s mode', (mode) => {
    it.each(screens)('%s', async (_name, make, needsButtons) => {
      sharedStore.set('theme.mode', mode);
      const ui = await render(themed(make(), scale));
      await act(async () => new Promise((r) => setTimeout(r, 20)));
      await flush();
      if (needsButtons) expect(ui.root.findAll(isPressable).length).toBeGreaterThan(0);
      expect(auditPressables(ui.root)).toEqual([]);
    });
  });
});

describe('every text size', () => {
  it.each(TEXT_SIZES)('%s: the play screen renders with labelled 56dp controls', async (size) => {
    useSettings.getState().update({ textSize: size });
    const ui = await render(themed(<Play />, fontScaleFor(size)));
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    await flush();
    expect(auditPressables(ui.root)).toEqual([]);
  });
});
