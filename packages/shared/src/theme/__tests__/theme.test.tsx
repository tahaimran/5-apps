import { mockHaptics, resetDisk } from '../../testing/native';
import { Component, act, type ReactElement, type ReactNode } from 'react';
import TestRenderer, { type ReactTestRenderer } from 'react-test-renderer';
import * as RN from 'react-native';
import { sharedStore } from '../../storage';
import { MIN_TOUCH, MIN_TOUCH_LARGE, baseType, defaultPalettes, motion, radius, spacing } from '../tokens';
import { ThemeProvider, useHaptics, useTheme, type Theme, type ThemeProviderProps } from '../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let live: ReactTestRenderer[] = [];
let scheme: 'light' | 'dark' | null | undefined = 'light';

beforeEach(() => {
  resetDisk();
  sharedStore.remove('theme.mode');
  scheme = 'light';
  jest.spyOn(RN, 'useColorScheme').mockImplementation((() => scheme) as never);
  jest.clearAllMocks();
});
afterEach(async () => {
  for (const r of live) await act(async () => r.unmount());
  live = [];
  jest.restoreAllMocks();
});

async function mountTheme(props: Partial<ThemeProviderProps> = {}) {
  let theme!: Theme;
  const Probe = (): ReactElement | null => {
    theme = useTheme();
    return null;
  };
  let r!: ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(
      <ThemeProvider {...props}>
        <Probe />
      </ThemeProvider>,
    );
  });
  live.push(r);
  return { get theme() { return theme; }, r, Probe };
}

describe('mode', () => {
  it('follows the system by default', async () => {
    const h = await mountTheme();
    expect(h.theme).toMatchObject({ mode: 'light', preference: 'system' });
    expect(h.theme.colors.background).toBe(defaultPalettes.light.background);
  });
  it('follows the system when it is dark', async () => {
    scheme = 'dark';
    expect((await mountTheme()).theme.mode).toBe('dark');
  });
  it('treats an unknown system scheme as light', async () => {
    scheme = null;
    expect((await mountTheme()).theme.mode).toBe('light');
  });
  it.each(['light', 'dark', 'high-contrast'] as const)('can be forced to %s regardless of the system', async (mode) => {
    scheme = mode === 'light' ? 'dark' : 'light';
    const h = await mountTheme();
    await act(async () => h.theme.setPreference(mode));
    expect(h.theme.mode).toBe(mode);
    expect(h.theme.colors).toEqual(defaultPalettes[mode]);
  });
  it('remembers the choice for the next launch', async () => {
    const h = await mountTheme();
    await act(async () => h.theme.setPreference('dark'));
    expect(sharedStore.get('theme.mode')).toBe('dark');
    const next = await mountTheme();
    expect(next.theme).toMatchObject({ mode: 'dark', preference: 'dark' });
  });
  it('goes back to following the system', async () => {
    const h = await mountTheme();
    await act(async () => h.theme.setPreference('dark'));
    await act(async () => h.theme.setPreference('system'));
    expect(h.theme.mode).toBe('light');
  });
  it('reacts when the system changes while following it', async () => {
    const h = await mountTheme();
    scheme = 'dark';
    await act(async () => h.r.update(<ThemeProvider><h.Probe /></ThemeProvider>));
    expect(h.theme.mode).toBe('dark');
  });
});

describe('palette overrides', () => {
  it('replace only the colors given, per mode', async () => {
    const h = await mountTheme({ palette: { light: { primary: '#123456' } } });
    expect(h.theme.colors.primary).toBe('#123456');
    expect(h.theme.colors.background).toBe(defaultPalettes.light.background);
    await act(async () => h.theme.setPreference('dark'));
    expect(h.theme.colors.primary).toBe(defaultPalettes.dark.primary);
  });
  it('can override the high-contrast palette too', async () => {
    const h = await mountTheme({ palette: { 'high-contrast': { accent: '#ABCDEF' } } });
    await act(async () => h.theme.setPreference('high-contrast'));
    expect(h.theme.colors.accent).toBe('#ABCDEF');
  });
});

describe('type scale and touch targets', () => {
  it('uses the base scale at 1x', async () => {
    expect((await mountTheme()).theme.type.body).toEqual(baseType.body);
  });
  it('scales sizes and line heights with fontScale, rounded', async () => {
    const h = await mountTheme({ fontScale: 1.15 });
    expect(h.theme.type.body).toEqual({ fontSize: Math.round(16 * 1.15), lineHeight: Math.round(22 * 1.15) });
    for (const key of Object.keys(baseType) as (keyof typeof baseType)[]) {
      expect(h.theme.type[key].lineHeight).toBeGreaterThanOrEqual(h.theme.type[key].fontSize);
    }
  });
  it('defaults to the 48dp minimum target', async () => {
    expect((await mountTheme()).theme.touchTarget).toBe(MIN_TOUCH);
  });
  it('allows a larger target for senior and maternity apps', async () => {
    expect((await mountTheme({ touchTarget: MIN_TOUCH_LARGE })).theme.touchTarget).toBe(56);
  });
  it('never goes below 48dp even if asked', async () => {
    expect((await mountTheme({ touchTarget: 30 })).theme.touchTarget).toBe(MIN_TOUCH);
  });
  it('exposes the shared spacing, radius and motion tokens', async () => {
    const { theme } = await mountTheme();
    expect(theme.spacing).toBe(spacing);
    expect(theme.radius).toBe(radius);
    expect(theme.motion).toBe(motion);
  });
});

describe('useTheme', () => {
  it('fails loudly outside a provider', async () => {
    let caught: Error | null = null;
    class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
      state = { failed: false };
      static getDerivedStateFromError() {
        return { failed: true };
      }
      componentDidCatch(error: Error) {
        caught = error;
      }
      render() {
        return this.state.failed ? null : this.props.children;
      }
    }
    const Bad = (): null => {
      useTheme();
      return null;
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => {
      live.push(TestRenderer.create(<Boundary><Bad /></Boundary>));
    });
    spy.mockRestore();
    expect((caught as Error | null)?.message).toContain('inside <ThemeProvider>');
  });
  it('keeps the same theme object between renders when nothing changed', async () => {
    const h = await mountTheme();
    const first = h.theme;
    await act(async () => h.r.update(<ThemeProvider><h.Probe /></ThemeProvider>));
    expect(h.theme).toBe(first);
  });
});

describe('palettes', () => {
  it('give every mode the same set of color tokens', () => {
    const keys = Object.keys(defaultPalettes.light).sort();
    expect(Object.keys(defaultPalettes.dark).sort()).toEqual(keys);
    expect(Object.keys(defaultPalettes['high-contrast']).sort()).toEqual(keys);
  });
  it('are all valid hex colors', () => {
    for (const palette of Object.values(defaultPalettes)) {
      for (const color of Object.values(palette)) expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('useHaptics', () => {
  it('maps the helpers to Expo Haptics', async () => {
    let haptics!: ReturnType<typeof useHaptics>;
    const Probe = (): null => {
      haptics = useHaptics();
      return null;
    };
    await act(async () => {
      live.push(TestRenderer.create(<Probe />));
    });
    haptics.tap();
    haptics.press();
    haptics.select();
    haptics.success();
    haptics.warning();
    haptics.error();
    expect(mockHaptics.impact.mock.calls).toEqual([['light'], ['medium']]);
    expect(mockHaptics.selection).toHaveBeenCalledTimes(1);
    expect(mockHaptics.notification.mock.calls).toEqual([['success'], ['warning'], ['error']]);
  });
});
