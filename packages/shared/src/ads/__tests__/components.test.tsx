import '../../testing/native';
import { resetDisk } from '../../testing/native';
import { mockSdk, resetAds } from '../../testing/adsNative';
import { act, type ReactElement } from 'react';
import TestRenderer, { type ReactTestRenderer } from 'react-test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import { defaultAdPolicy, type AdUnits } from '../policy';

const mockMaybeShowAppOpen = jest.fn(async () => true);
jest.mock('../fullscreen', () => ({
  ...jest.requireActual('../fullscreen'),
  maybeShowAppOpen: () => mockMaybeShowAppOpen(),
}));

import { AdBanner, NativeAdCard, setAdGuard, useAppOpenAd } from '../index';
import { adsState, notifyAds } from '../state';
import { ThemeProvider } from '../../theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const UNITS: AdUnits = {
  home: { format: 'banner', unitId: 'real-banner' },
  history: { format: 'native', unitId: 'real-native' },
  level_end: { format: 'interstitial', unitId: 'real-int' },
};

let live: ReactTestRenderer[] = [];
async function mount(el: ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(el);
  });
  live.push(r);
  return r;
}

/** Puts the ads layer in the "SDK ready" state without going through consent. */
const makeReady = (over: Partial<typeof adsState> = {}) =>
  act(async () => {
    Object.assign(adsState, { ready: true, units: UNITS, policy: { ...defaultAdPolicy, firstSessionGraceMs: 0 }, guard: null, ...over });
    notifyAds();
  });

const hostTypes = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === 'string').map((n) => n.type as unknown as string);
const bannerOf = (r: ReactTestRenderer) => r.root.findAll((n) => (n.type as unknown) === 'BannerAd')[0];

beforeEach(() => {
  resetDisk();
  resetAds();
  mockMaybeShowAppOpen.mockClear();
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;
  Object.assign(adsState, { ready: false, units: UNITS, policy: defaultAdPolicy, guard: null, isFirstSession: false });
});
afterEach(async () => {
  for (const r of live) await act(async () => r.unmount());
  live = [];
  jest.restoreAllMocks();
});

describe('<AdBanner>', () => {
  it('renders nothing until ads are ready', async () => {
    const r = await mount(<AdBanner placement="home" />);
    expect(r.toJSON()).toBeNull();
  });
  it('shows an adaptive anchored banner with the test id once ready, without a remount', async () => {
    const r = await mount(<AdBanner placement="home" />);
    await makeReady();
    expect(bannerOf(r).props).toMatchObject({ unitId: 'test-banner', size: 'LARGE_ANCHORED_ADAPTIVE_BANNER', maxHeight: 60 });
  });
  it('uses the real id in a release build', async () => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    await makeReady();
    expect(bannerOf(await mount(<AdBanner placement="home" />)).props.unitId).toBe('real-banner');
  });
  it('renders nothing for unknown placements or ones of another format', async () => {
    await makeReady();
    expect((await mount(<AdBanner placement="nope" />)).toJSON()).toBeNull();
    expect((await mount(<AdBanner placement="level_end" />)).toJSON()).toBeNull();
  });
  it('follows the app guard, and comes back when the veto is lifted', async () => {
    await makeReady();
    const r = await mount(<AdBanner placement="home" />);
    expect(hostTypes(r)).toContain('BannerAd');
    await act(async () => setAdGuard(() => false));
    expect(r.toJSON()).toBeNull();
    await act(async () => setAdGuard(null));
    expect(hostTypes(r)).toContain('BannerAd');
  });
  it('disappears after a failed load so there is no empty gap', async () => {
    await makeReady();
    const r = await mount(<AdBanner placement="home" />);
    await act(async () => bannerOf(r).props.onAdFailedToLoad(new Error('no fill')));
    expect(r.toJSON()).toBeNull();
  });
  it('is hidden from screen readers (an ad is not content)', async () => {
    await makeReady();
    const r = await mount(<AdBanner placement="home" />);
    expect(r.root.findAll((n) => n.props.importantForAccessibility === 'no-hide-descendants')).not.toHaveLength(0);
  });
  it('renders nothing when ads are switched off', async () => {
    await makeReady({ policy: { ...defaultAdPolicy, adsEnabled: false } });
    expect((await mount(<AdBanner placement="home" />)).toJSON()).toBeNull();
  });
});

describe('<NativeAdCard>', () => {
  const card = (props: Partial<Parameters<typeof NativeAdCard>[0]> = {}) => (
    <ThemeProvider>
      <NativeAdCard placement="history" {...props} />
    </ThemeProvider>
  );
  const text = (r: ReactTestRenderer) => JSON.stringify(r.toJSON());

  it('renders nothing when ads are unavailable or vetoed', async () => {
    expect((await mount(card())).toJSON()).toBeNull();
    await makeReady({ guard: () => false });
    expect((await mount(card())).toJSON()).toBeNull();
  });
  it('renders nothing for an unknown placement', async () => {
    await makeReady();
    expect((await mount(card({ placement: 'nope' }))).toJSON()).toBeNull();
  });
  it.each(['idle', 'loading'])('renders nothing while the ad is %s', async (status) => {
    await makeReady();
    mockSdk.native.current = { status, nativeAd: null, error: null };
    expect((await mount(card())).toJSON()).toBeNull();
  });
  it('shows the ad with an "Ad" badge and its text', async () => {
    await makeReady();
    mockSdk.native.current = { status: 'loaded', nativeAd: { headline: 'Buy shoes', body: 'Great shoes', callToAction: 'Shop' }, error: null };
    const out = text(await mount(card()));
    expect(out).toContain('Buy shoes');
    expect(out).toContain('Great shoes');
    expect(out).toContain('Shop');
    expect(out).toContain('"Ad"');
  });
  it.each(['no-fill', 'error'])('falls back to a house ad on %s, never promoting the current app', async (status) => {
    await makeReady();
    mockSdk.native.current = { status, nativeAd: null, error: new Error('x') };
    const out = text(await mount(card({ currentApp: 'habit-tracker' })));
    expect(out).toContain('Our apps');
    expect(out).toContain('Install');
    expect(out).not.toContain('Habit Tracker');
  });
});

describe('useAppOpenAd', () => {
  /** Captures the AppState listener so the test can move the app between states. */
  function appState() {
    let handler: ((s: AppStateStatus) => void) | undefined;
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_t: string, cb: (s: AppStateStatus) => void) => {
      handler = cb;
      return { remove };
    }) as never);
    return { send: (s: AppStateStatus) => act(async () => handler?.(s)), remove };
  }
  const Probe = ({ canShow }: { canShow: () => boolean }) => {
    useAppOpenAd(canShow);
    return null;
  };
  beforeEach(() => {
    jest.useFakeTimers({ now: 5_000_000, doNotFake: ['nextTick', 'setImmediate'] });
    adsState.policy = { ...defaultAdPolicy, appOpenMinBackgroundMs: 30_000 };
  });
  afterEach(() => jest.useRealTimers());

  it('asks to show after returning from a long enough stay in the background', async () => {
    const app = appState();
    await mount(<Probe canShow={() => true} />);
    await app.send('background');
    jest.advanceTimersByTime(31_000);
    await app.send('active');
    expect(mockMaybeShowAppOpen).toHaveBeenCalledTimes(1);
  });
  it('does not show after a short trip to the background', async () => {
    const app = appState();
    await mount(<Probe canShow={() => true} />);
    await app.send('background');
    jest.advanceTimersByTime(10_000);
    await app.send('active');
    expect(mockMaybeShowAppOpen).not.toHaveBeenCalled();
  });
  it('does not show on a cold start, or when coming back from "inactive"', async () => {
    const app = appState();
    await mount(<Probe canShow={() => true} />);
    await app.send('active');
    await app.send('inactive');
    jest.advanceTimersByTime(60_000);
    await app.send('active');
    expect(mockMaybeShowAppOpen).not.toHaveBeenCalled();
  });
  it('uses the threshold from the policy', async () => {
    adsState.policy = { ...defaultAdPolicy, appOpenMinBackgroundMs: 4 * 3_600_000 };
    const app = appState();
    await mount(<Probe canShow={() => true} />);
    await app.send('background');
    jest.advanceTimersByTime(3_600_000);
    await app.send('active');
    expect(mockMaybeShowAppOpen).not.toHaveBeenCalled();
    await app.send('background');
    jest.advanceTimersByTime(4 * 3_600_000 + 1);
    await app.send('active');
    expect(mockMaybeShowAppOpen).toHaveBeenCalledTimes(1);
  });
  it('lets the app veto with canShow', async () => {
    const app = appState();
    await mount(<Probe canShow={() => false} />);
    await app.send('background');
    jest.advanceTimersByTime(60_000);
    await app.send('active');
    expect(mockMaybeShowAppOpen).not.toHaveBeenCalled();
  });
  it('uses the latest canShow without re-subscribing', async () => {
    const app = appState();
    const r = await mount(<Probe canShow={() => false} />);
    const subscribed = (AppState.addEventListener as jest.Mock).mock.calls.length;
    await act(async () => r.update(<Probe canShow={() => true} />));
    expect((AppState.addEventListener as jest.Mock).mock.calls.length).toBe(subscribed);
    await app.send('background');
    jest.advanceTimersByTime(60_000);
    await app.send('active');
    expect(mockMaybeShowAppOpen).toHaveBeenCalledTimes(1);
  });
  it('stops listening when unmounted', async () => {
    const app = appState();
    const r = await mount(<Probe canShow={() => true} />);
    await act(async () => r.unmount());
    live = [];
    expect(app.remove).toHaveBeenCalledTimes(1);
  });
});
