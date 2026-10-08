import { resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { sharedStore } from '@shared/storage';
import { resetAdsStart } from '@/ads/start';
import RootLayout from '../../app/_layout';
import Index from '../../app/index';
import { useMeta } from '@/store/meta';

const mockInitAds = jest.fn(async () => undefined);
jest.mock('@shared/ads', () => ({
  ...jest.requireActual('@shared/ads'),
  initAds: () => mockInitAds(),
  useAppOpenAd: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 14, 0), doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(new Date(2026, 9, 8, 14, 0));
  resetNotifMock();
  resetAdsStart();
  mockInitAds.mockClear();
  sharedStore.remove('onboarding.completedAt');
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('root layout', () => {
  it('counts the launch, installs the ad veto and waits with consent and ads during the first run', async () => {
    const { adsState } = require('@shared/ads/state') as typeof import('@shared/ads/state');
    await render(<RootLayout />);
    expect(useMeta.getState().meta.launches).toBe(1);
    expect(adsState.guard).not.toBeNull();
    expect(mockInitAds).not.toHaveBeenCalled(); // onboarding is not done: no consent, no ad request
  });
  it('starts consent and ads at launch once onboarding is done', async () => {
    sharedStore.set('onboarding.completedAt', 1);
    await render(<RootLayout />);
    expect(mockInitAds).toHaveBeenCalledTimes(1);
  });
  it('asks the app-open hook to veto by the plan rules (never on the first 3 launches)', async () => {
    const { useAppOpenAd } = require('@shared/ads') as { useAppOpenAd: jest.Mock };
    sharedStore.set('onboarding.completedAt', 1);
    await render(<RootLayout />);
    const canShow = useAppOpenAd.mock.calls.at(-1)[0] as () => boolean;
    expect(canShow()).toBe(false); // launches = 1
    useMeta.setState({ meta: { ...useMeta.getState().meta, launches: 6 } });
    expect(canShow()).toBe(true);
  });
});

describe('index', () => {
  it('sends a first run to onboarding and a returning user to Today', async () => {
    const first = await render(<Index />);
    expect(first.root.findAll((n) => (n.type as unknown) === 'Redirect')[0].props.href).toBe('/onboarding');
    await cleanup();
    sharedStore.set('onboarding.completedAt', 1);
    const again = await render(<Index />);
    expect(again.root.findAll((n) => (n.type as unknown) === 'Redirect')[0].props.href).toBe('/(tabs)');
  });
});
