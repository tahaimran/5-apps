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
/** Files the app deleted from the cache, and which uris "exist". */
export const mockFiles = { deleted: [] as string[], missing: new Set<string>(), failDelete: false };
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists() {
      return !mockFiles.missing.has(this.uri);
    }
    delete() {
      if (mockFiles.failDelete) throw new Error('cannot delete');
      mockFiles.deleted.push(this.uri);
    }
  },
}));
/** The PDF made by expo-print and what the share sheet was given. */
export const mockShare = { printed: [] as { html: string }[], shared: [] as { uri: string; options: Record<string, unknown> }[], available: true, failPrint: false, text: [] as { message?: string; title?: string }[] };
jest.mock('expo-print', () => ({
  printToFileAsync: async (o: { html: string }) => {
    if (mockShare.failPrint) throw new Error('print failed');
    mockShare.printed.push(o);
    return { uri: `file:///cache/Print/summary-${mockShare.printed.length}.pdf` };
  },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: async () => mockShare.available,
  shareAsync: async (uri: string, options: Record<string, unknown>) => void mockShare.shared.push({ uri, options }),
}));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0', android: { package: 'com.fiveapps.contractiontimer' } } } }));
jest.mock('expo-linking', () => ({ openURL: jest.fn(async () => undefined) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US', textDirection: 'ltr' }],
  useLocales: () => [{ languageCode: 'en', languageTag: 'en-US', textDirection: 'ltr' }],
}));
/** The system review prompt: `available` is what the phone says, `request` records that it was shown. */
export const mockReview = { available: false, request: jest.fn(async () => undefined) };
/** Which keep-awake tags are active right now. */
export const mockKeepAwake = { active: new Set<string>() };
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: async (tag = 'default') => void mockKeepAwake.active.add(tag),
  deactivateKeepAwake: async (tag = 'default') => void mockKeepAwake.active.delete(tag),
}));
jest.mock('expo-store-review', () => ({ isAvailableAsync: async () => mockReview.available, requestReview: () => mockReview.request() }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: async () => undefined, hideAsync: async () => undefined }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

/** What the fake system says about the notification permission, what the user answers, and what is scheduled. */
export const mockNotif = { granted: false, canAskAgain: true, answer: true, keepAsking: false };
export const mockNotifState = {
  pending: new Map<string, { identifier: string; content: Record<string, unknown>; trigger: Record<string, unknown> }>(),
  channels: new Map<string, Record<string, unknown>>(),
};
export const mockLastNotificationResponse: { current: unknown } = { current: null };
export const resetNotifMock = () => {
  Object.assign(mockNotif, { granted: false, canAskAgain: true, answer: true, keepAsking: false });
  mockReview.available = false;
  mockReview.request.mockClear();
  mockKeepAwake.active.clear();
  Object.assign(mockFiles, { deleted: [], failDelete: false });
  mockFiles.missing.clear();
  Object.assign(mockShare, { printed: [], shared: [], available: true, failPrint: false, text: [] });
  mockNotifState.pending.clear();
  mockNotifState.channels.clear();
  mockLastNotificationResponse.current = null;
};
jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, LOW: 2, HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  getPermissionsAsync: async () => ({ granted: mockNotif.granted, canAskAgain: mockNotif.canAskAgain }),
  requestPermissionsAsync: async () => {
    mockNotif.granted = mockNotif.answer;
    mockNotif.canAskAgain = mockNotif.answer || mockNotif.keepAsking;
    return { granted: mockNotif.answer };
  },
  setNotificationChannelAsync: async (id: string, c: Record<string, unknown>) => void mockNotifState.channels.set(id, c),
  setNotificationHandler: () => undefined,
  getAllScheduledNotificationsAsync: async () => [...mockNotifState.pending.values()],
  cancelScheduledNotificationAsync: async (id: string) => void mockNotifState.pending.delete(id),
  scheduleNotificationAsync: async (req: { identifier: string; content: Record<string, unknown>; trigger: Record<string, unknown> }) => {
    mockNotifState.pending.set(req.identifier, req);
    return req.identifier;
  },
  useLastNotificationResponse: () => mockLastNotificationResponse.current,
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));

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
  return { __esModule: true, default: box, Svg: box, Circle: box, G: box, Path: box, Rect: box, Line: box, Text: box, Polyline: box };
});
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

/**
 * react-native-gesture-handler stand-in. `Gesture.Pan()/Tap()` record their callbacks so tests can
 * drive a drag or a tap by calling `mockGestures.pan.onBegin(...)` etc.
 */
type Handlers = Record<string, ((e: unknown, success?: boolean) => void) | undefined>;
export const mockGestures: { pan: Handlers; tap: Handlers } = { pan: {}, tap: {} };
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const chain = (target: 'pan' | 'tap') => {
    const handlers: Handlers = {};
    mockGestures[target] = handlers;
    const api: Record<string, unknown> = {};
    for (const name of ['onBegin', 'onStart', 'onUpdate', 'onEnd', 'onFinalize']) {
      api[name] = (fn: (e: unknown, success?: boolean) => void) => {
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
    Easing: { out: passthrough, quad: passthrough, inOut: passthrough, ease: 1 },
  };
});

export const mockPath: { current: string } = { current: '/timer' };
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
    usePathname: () => mockPath.current,
    useNavigation: () => ({ addListener: () => () => undefined, dispatch: jest.fn() }),
  };
});
