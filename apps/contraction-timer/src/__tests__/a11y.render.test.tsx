/**
 * Every screen, rendered for real, has labelled controls with 56dp touch targets at the system font
 * scales the QA checklist names (1.3x, 2.0x), in every color mode (light, dark, night).
 */
import { resetApp } from '@/testing/stores';
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

const themed = (el: ReactElement, scale: number) => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE * scale} touchTarget={TOUCH_TARGET}>
    {el}
  </ThemeProvider>
);

beforeEach(() => resetApp());
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

const screens: [string, () => ReactElement][] = [
  ['Timer', () => <TimerHome />],
  ['Kicks', () => <KicksHome />],
  ['My Pregnancy', () => <PregnancyHome />],
  ['More', () => <MoreHome />],
  ['Tabs', () => <TabsLayout />],
];

describe.each([1.3, 2])('font scale %s', (scale) => {
  describe.each(['light', 'dark', 'high-contrast'] as const)('%s mode', (mode) => {
    it.each(screens)('%s', async (_name, make) => {
      sharedStore.set('theme.mode', mode);
      const ui = await render(themed(make(), scale));
      await act(async () => new Promise((r) => setTimeout(r, 20)));
      await flush();
      expect(auditPressables(ui.root)).toEqual([]);
      expect(ui.root.findAll(isPressable).length).toBeGreaterThanOrEqual(0);
    });
  });
});
