/**
 * A controllable fake of react-native-google-mobile-ads. Import it first in a test file.
 * Tests drive it: `lastAd('interstitial').emit('loaded')`, `mockSdk.consent.canRequestAds = true`, ...
 */
export type AdKind = 'interstitial' | 'rewarded' | 'appOpen';

export interface FakeAd {
  kind: AdKind;
  unitId: string;
  loadCalls: number;
  showCalls: number;
  /** Make the next show() reject. */
  failShow: boolean;
  emit: (type: string, payload?: unknown) => void;
  listenerCount: () => number;
}

export const mockAds: FakeAd[] = [];
export const mockSdk = {
  initialize: jest.fn(async () => []),
  setRequestConfiguration: jest.fn(async (_c: unknown) => undefined),
  consent: {
    canRequestAds: false,
    required: false,
    gatherFails: false,
    infoFails: false,
    gather: jest.fn(),
    info: jest.fn(),
    privacyForm: jest.fn(),
  },
  native: { current: { status: 'idle', nativeAd: null, error: null } as Record<string, unknown> },
};

export const resetAds = () => {
  mockAds.length = 0;
  mockSdk.initialize.mockClear();
  mockSdk.setRequestConfiguration.mockClear();
  Object.assign(mockSdk.consent, { canRequestAds: false, required: false, gatherFails: false, infoFails: false });
  mockSdk.consent.gather.mockClear();
  mockSdk.consent.info.mockClear();
  mockSdk.consent.privacyForm.mockClear();
  mockSdk.native.current = { status: 'idle', nativeAd: null, error: null };
};

export const adsOf = (kind: AdKind) => mockAds.filter((a) => a.kind === kind);
export const lastAd = (kind: AdKind) => adsOf(kind).at(-1)!;

jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const make = (kind: AdKind) => (unitId: string) => {
    const listeners = new Map<string, Set<(p?: unknown) => void>>();
    const ad: FakeAd & Record<string, unknown> = {
      kind,
      unitId,
      loadCalls: 0,
      showCalls: 0,
      failShow: false,
      emit: (type: string, payload?: unknown) => [...(listeners.get(type) ?? [])].forEach((l) => l(payload)),
      listenerCount: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
      addAdEventListener: (type: string, l: (p?: unknown) => void) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(l);
        return () => listeners.get(type)!.delete(l);
      },
      load: () => {
        ad.loadCalls++;
      },
      show: () => {
        ad.showCalls++;
        return ad.failShow ? Promise.reject(new Error('show failed')) : Promise.resolve();
      },
    };
    mockAds.push(ad);
    return ad;
  };
  const mobileAds = () => ({ initialize: mockSdk.initialize, setRequestConfiguration: mockSdk.setRequestConfiguration });
  return {
    __esModule: true,
    default: mobileAds,
    MobileAds: mobileAds,
    InterstitialAd: { createForAdRequest: make('interstitial') },
    RewardedAd: { createForAdRequest: make('rewarded') },
    AppOpenAd: { createForAdRequest: make('appOpen') },
    AdEventType: { LOADED: 'loaded', ERROR: 'error', OPENED: 'opened', CLOSED: 'closed', CLICKED: 'clicked' },
    RewardedAdEventType: { LOADED: 'rewarded_loaded', EARNED_REWARD: 'rewarded_earned_reward' },
    MaxAdContentRating: { G: 'G', PG: 'PG', T: 'T', MA: 'MA' },
    TestIds: {
      ADAPTIVE_BANNER: 'test-banner',
      INTERSTITIAL: 'test-interstitial',
      REWARDED: 'test-rewarded',
      APP_OPEN: 'test-app-open',
      NATIVE: 'test-native',
    },
    BannerAdSize: { LARGE_ANCHORED_ADAPTIVE_BANNER: 'LARGE_ANCHORED_ADAPTIVE_BANNER' },
    BannerAd: (props: Record<string, unknown>) => React.createElement('BannerAd', props),
    NativeAdView: (props: Record<string, unknown>) => React.createElement('NativeAdView', props, props.children),
    NativeAsset: (props: Record<string, unknown>) => props.children,
    NativeAssetType: { HEADLINE: 'headline', BODY: 'body', CALL_TO_ACTION: 'callToAction' },
    NativeMediaView: () => null,
    useNativeAd: () => mockSdk.native.current,
    AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED', UNKNOWN: 'UNKNOWN' },
    AdsConsent: {
      gatherConsent: async () => {
        mockSdk.consent.gather();
        if (mockSdk.consent.gatherFails) throw new Error('UMP failed');
        return { canRequestAds: mockSdk.consent.canRequestAds };
      },
      getConsentInfo: async () => {
        mockSdk.consent.info();
        if (mockSdk.consent.infoFails) throw new Error('no info');
        return {
          canRequestAds: mockSdk.consent.canRequestAds,
          privacyOptionsRequirementStatus: mockSdk.consent.required ? 'REQUIRED' : 'NOT_REQUIRED',
        };
      },
      showPrivacyOptionsForm: async () => {
        mockSdk.consent.privacyForm();
        return { canRequestAds: mockSdk.consent.canRequestAds };
      },
    },
  };
});
