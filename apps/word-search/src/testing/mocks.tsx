/**
 * Native and router stand-ins for rendering the real screens in Jest. Import this file first in
 * a UI test so the mocks are registered before any screen module loads.
 */
import React from 'react';

type Disk = Map<string, Map<string, string | number>>;
export const mockDisk: Disk = new Map();
/** Empties every store in place (stores keep their handle to the same map). */
export const resetDisk = () => {
  for (const m of mockDisk.values()) m.clear();
};

jest.mock('react-native-mmkv', () => ({
  createMMKV: ({ id }: { id: string }) => {
    if (!mockDisk.has(id)) mockDisk.set(id, new Map());
    const m = mockDisk.get(id)!;
    return {
      getString: (k: string) => (typeof m.get(k) === 'string' ? (m.get(k) as string) : undefined),
      getNumber: (k: string) => (typeof m.get(k) === 'number' ? (m.get(k) as number) : undefined),
      set: (k: string, v: string | number) => void m.set(k, v),
      remove: (k: string) => m.delete(k),
      getAllKeys: () => [...m.keys()],
      clearAll: () => m.clear(),
    };
  },
}));
jest.mock('expo-file-system', () => ({ Paths: { cache: 'file:///cache' }, File: class {} }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }));
jest.mock('expo-linking', () => ({ openURL: jest.fn(async () => undefined) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US', textDirection: 'ltr' }],
  useLocales: () => [{ languageCode: 'en', languageTag: 'en-US', textDirection: 'ltr' }],
}));
jest.mock('expo-store-review', () => ({ isAvailableAsync: async () => false, requestReview: jest.fn() }));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: async () => undefined, hideAsync: async () => undefined }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@expo-google-fonts/atkinson-hyperlegible', () => ({ AtkinsonHyperlegible_400Regular: 1, AtkinsonHyperlegible_700Bold: 2 }));

/** Everything the fake ads SDK was asked to do, for assertions. */
export const mockAds = {
  /** Keys of the ad types the SDK "has loaded". */
  consent: { canRequestAds: false },
  initialized: 0,
  requestConfig: null as unknown,
};
export const resetAdsMock = () => {
  mockAds.consent = { canRequestAds: false };
  mockAds.initialized = 0;
  mockAds.requestConfig = null;
};
jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({
    initialize: async () => {
      mockAds.initialized++;
      return [];
    },
    setRequestConfiguration: async (c: unknown) => {
      mockAds.requestConfig = c;
    },
  }),
  AdsConsent: {
    gatherConsent: async () => mockAds.consent,
    getConsentInfo: async () => ({ canRequestAds: mockAds.consent.canRequestAds, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),
    showPrivacyOptionsForm: async () => mockAds.consent,
  },
  AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'REQUIRED' },
  BannerAd: () => null,
  BannerAdSize: { LARGE_ANCHORED_ADAPTIVE_BANNER: 'x' },
  NativeAdView: () => null,
  NativeAsset: () => null,
  NativeAssetType: {},
  NativeMediaView: () => null,
  useNativeAd: () => ({ status: 'idle', nativeAd: null, error: null }),
  TestIds: { ADAPTIVE_BANNER: 'b', INTERSTITIAL: 'i', REWARDED: 'r', APP_OPEN: 'a', NATIVE: 'n' },
  MaxAdContentRating: { G: 'G', PG: 'PG', T: 'T', MA: 'MA' },
  InterstitialAd: { createForAdRequest: () => ({ addAdEventListener: () => () => undefined, load: () => undefined }) },
  RewardedAd: { createForAdRequest: () => ({ addAdEventListener: () => () => undefined, load: () => undefined }) },
  AppOpenAd: { createForAdRequest: () => ({ addAdEventListener: () => () => undefined, load: () => undefined }) },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  RewardedAdEventType: { LOADED: 'rl', EARNED_REWARD: 'er' },
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const box = (props: Record<string, unknown>) => React.createElement(View, props);
  return { __esModule: true, default: box, Svg: box, Circle: box, G: box, Path: box, Rect: box, Line: box, Text: box };
});
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

/**
 * react-native-gesture-handler stand-in. `Gesture.Pan()/Tap()` record their callbacks so tests can
 * drive a drag or a tap by calling `mockGestures.pan.onBegin(...)` etc.
 */
type Handlers = Record<string, ((e: unknown) => void) | undefined>;
export const mockGestures: { pan: Handlers; tap: Handlers } = { pan: {}, tap: {} };
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const chain = (target: 'pan' | 'tap') => {
    const handlers: Handlers = {};
    mockGestures[target] = handlers;
    const api: Record<string, unknown> = {};
    for (const name of ['onBegin', 'onStart', 'onUpdate', 'onEnd', 'onFinalize']) {
      api[name] = (fn: (e: unknown) => void) => {
        handlers[name] = fn;
        return api;
      };
    }
    for (const name of ['runOnJS', 'minDistance', 'maxDistance', 'enabled', 'hitSlop', 'maxDuration', 'shouldCancelWhenOutside']) api[name] = () => api;
    return api;
  };
  return {
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: { Pan: () => chain('pan'), Tap: () => chain('tap'), Race: (...g: unknown[]) => g[0], Exclusive: (...g: unknown[]) => g[0], Simultaneous: (...g: unknown[]) => g[0] },
  };
});

/** `reduced: false` renders the animated paths. */
export const mockMotion = { reduced: true };
jest.mock('react-native-reanimated', () => {
  const { View, ScrollView } = require('react-native');
  const passthrough = (v: unknown) => v;
  const Animated = { View, ScrollView, createAnimatedComponent: passthrough };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    useReducedMotion: () => mockMotion.reduced,
    withRepeat: passthrough,
    withSequence: (...v: unknown[]) => v[0],
    withTiming: passthrough,
    withSpring: passthrough,
    withDelay: (_d: unknown, v: unknown) => v,
    runOnJS: (f: unknown) => f,
    Easing: { out: passthrough, quad: passthrough },
  };
});

export const mockRouter = {
  push: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismissAll: jest.fn(),
  canGoBack: () => true,
};
export const mockParams: { current: Record<string, string> } = { current: {} };

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    router: mockRouter,
    Stack: Object.assign(({ children }: { children: React.ReactNode }) => children ?? null, { Screen: () => null }),
    Tabs: Object.assign(({ children }: { children: React.ReactNode }) => children ?? null, { Screen: () => null }),
    Redirect: ({ href }: { href: string }) => React.createElement('Redirect', { href }),
    useLocalSearchParams: () => mockParams.current,
    useFocusEffect: (cb: () => void | (() => void)) => React.useEffect(cb, []),
    useNavigation: () => ({ addListener: () => () => undefined, dispatch: jest.fn() }),
  };
});
