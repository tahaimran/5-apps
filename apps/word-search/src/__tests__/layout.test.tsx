import '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { sharedStore } from '@shared/storage';
import { t } from '@shared/i18n';
import '@/bootstrap';
import RootLayout from '../../app/_layout';
import Home from '../../app/(tabs)/index';
import Daily from '../../app/(tabs)/daily';
import SettingsTab from '../../app/(tabs)/settings';
import TabsLayout from '../../app/(tabs)/_layout';
import { useSettings } from '@/store/settings';
import { ThemeProvider } from '@shared/theme';
import { palette, TOUCH_TARGET } from '@/theme/tokens';

beforeEach(() => resetApp());
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

describe('app shell', () => {
  it('renders the root layout with its providers', async () => {
    const ui = await render(<RootLayout />);
    expect(ui.root).toBeTruthy();
  });

  it('renders every tab screen with its title', async () => {
    for (const [Screen, key] of [[Home, 'home.title'], [Daily, 'daily.title'], [SettingsTab, 'settings.title']] as const) {
      const ui = await render(
        <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>
          <Screen />
        </ThemeProvider>,
      );
      expect(ui.texts()).toContain(t(key));
    }
  });

  it('renders the tab bar layout', async () => {
    const ui = await render(
      <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>
        <TabsLayout />
      </ThemeProvider>,
    );
    expect(ui.root).toBeTruthy();
  });
});

describe('settings store', () => {
  it('starts on the plan defaults and persists changes', () => {
    expect(useSettings.getState().settings).toMatchObject({ textSize: 'large', difficulty: 'easy', selectionMode: 'both', showTimer: false });
    useSettings.getState().update({ textSize: 'huge' });
    const { db } = require('@/store/storage');
    expect(db.get('settings').textSize).toBe('huge');
    useSettings.getState().reset();
    expect(useSettings.getState().settings.textSize).toBe('large');
  });
});

describe('strings', () => {
  it('has no tab without a label', () => {
    for (const k of ['tabs.play', 'tabs.daily', 'tabs.settings']) expect(t(k)).not.toBe(k);
  });
});
