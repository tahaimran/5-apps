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

jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => undefined) }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }));
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
export const mockLastNotificationResponse: { current: unknown } = { current: null };
/** What the fake system says about the notification permission and what the user answers. */
export const mockNotif = { granted: false, canAskAgain: true, answer: true };
export const resetNotifMock = () => Object.assign(mockNotif, { granted: false, canAskAgain: true, answer: true });

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, LOW: 2, HIGH: 4 },
  DEFAULT_ACTION_IDENTIFIER: 'default',
  getPermissionsAsync: async () => ({ granted: mockNotif.granted, canAskAgain: mockNotif.canAskAgain }),
  requestPermissionsAsync: async () => {
    mockNotif.granted = mockNotif.answer;
    mockNotif.canAskAgain = mockNotif.answer;
    return { granted: mockNotif.answer };
  },
  setNotificationCategoryAsync: async () => undefined,
  setNotificationChannelAsync: async () => undefined,
  setNotificationHandler: () => undefined,
  getAllScheduledNotificationsAsync: async () => [],
  cancelScheduledNotificationAsync: async () => undefined,
  scheduleNotificationAsync: async () => 'id',
  dismissNotificationAsync: async () => undefined,
  useLastNotificationResponse: () => mockLastNotificationResponse.current,
  registerTaskAsync: async () => null,
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-task', () => ({
  registerTaskAsync: jest.fn(async () => undefined),
  BackgroundTaskResult: { Success: 1, Failed: 2 },
}));
jest.mock('expo-device', () => ({ manufacturer: 'Google' }));
jest.mock('expo-intent-launcher', () => ({ startActivityAsync: jest.fn(async () => ({})) }));
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const box = (props: Record<string, unknown>) => React.createElement(View, props);
  return { __esModule: true, default: box, Svg: box, Circle: box, G: box, Path: box, Rect: box };
});
jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({ initialize: async () => [], setRequestConfiguration: async () => undefined }),
  AdsConsent: {
    gatherConsent: async () => ({ canRequestAds: false }),
    getConsentInfo: async () => ({ canRequestAds: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),
    showPrivacyOptionsForm: async () => ({ canRequestAds: false }),
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
  MaxAdContentRating: { T: 'T' },
  InterstitialAd: { createForAdRequest: () => ({ addAdEventListener: () => () => undefined, load: () => undefined }) },
  RewardedAd: { createForAdRequest: () => ({ addAdEventListener: () => () => undefined, load: () => undefined }) },
  AppOpenAd: { createForAdRequest: () => ({ addAdEventListener: () => () => undefined, load: () => undefined }) },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  RewardedAdEventType: { LOADED: 'rl', EARNED_REWARD: 'er' },
}));

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = (v: unknown) => v;
  const Animated = { View, createAnimatedComponent: passthrough };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => true,
    withRepeat: passthrough,
    withSequence: (...v: unknown[]) => v[0],
    withTiming: passthrough,
    withSpring: passthrough,
    runOnJS: (f: unknown) => f,
    Easing: { out: passthrough, quad: passthrough },
    FadeInDown: { duration: () => undefined },
    FadeOut: { duration: () => undefined },
    __react: React,
  };
});

export const mockRouter = {
  push: jest.fn(),
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
