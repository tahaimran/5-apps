/**
 * Jest stand-ins for the animation, drawing and audio native modules, shared by the package's tests
 * and every app's. Use inside a factory: jest.mock('react-native-reanimated', () => require(...).reanimatedMock()).
 */

/** Any layout-animation builder (FadeIn.duration(200).easing(...)) chains to itself. */
function chainable(): unknown {
  const fn: unknown = new Proxy(() => fn, { get: (_t, key) => (key === 'then' ? undefined : fn), apply: () => fn });
  return fn;
}

export function reanimatedMock() {
  const React = require('react');
  const { View, Text, ScrollView, Image } = require('react-native');
  const passthrough = (v: unknown) => v;
  const Animated = { View, Text, ScrollView, Image, createAnimatedComponent: passthrough };
  const sharedValue = (initial: unknown) => {
    const sv = {
      value: initial,
      get: () => sv.value,
      set: (v: unknown) => {
        sv.value = typeof v === 'function' ? (v as (x: unknown) => unknown)(sv.value) : v;
      },
    };
    return sv;
  };
  const builder = chainable();
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v: unknown) => React.useState(() => sharedValue(v))[0],
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    useDerivedValue: (f: () => unknown) => sharedValue(f()),
    useAnimatedReaction: () => undefined,
    useReducedMotion: () => true,
    withRepeat: passthrough,
    withSequence: (...v: unknown[]) => v[v.length - 1],
    withTiming: passthrough,
    withSpring: passthrough,
    withDelay: (_ms: number, v: unknown) => v,
    cancelAnimation: () => undefined,
    runOnJS: (f: unknown) => f,
    interpolate: (v: number) => v,
    Easing: { out: passthrough, in: passthrough, inOut: passthrough, quad: passthrough, bezier: () => passthrough, linear: passthrough },
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    cubicBezier: () => 'ease-out',
    FadeIn: builder,
    FadeOut: builder,
    FadeInDown: builder,
    FadeOutDown: builder,
    FadeInUp: builder,
    FadeOutUp: builder,
    ZoomIn: builder,
    ZoomOut: builder,
    LinearTransition: builder,
  };
}

export function workletsMock() {
  return { scheduleOnRN: (f: (...a: unknown[]) => unknown, ...args: unknown[]) => f(...args), scheduleOnUI: () => undefined };
}

export function svgMock() {
  const { View } = require('react-native');
  const Host = ({ children }: { children?: unknown }) => require('react').createElement(View, null, children);
  return { __esModule: true, default: Host, Svg: Host, Circle: () => null, Path: () => null, Rect: () => null, G: Host, Line: () => null, Polyline: () => null, Polygon: () => null, Ellipse: () => null, Defs: Host, LinearGradient: Host, Stop: () => null };
}

export function linearGradientMock() {
  const { View } = require('react-native');
  return { LinearGradient: View };
}

export const mockAudio = { play: jest.fn((_source?: unknown) => undefined), seekTo: jest.fn(async () => undefined), setAudioMode: jest.fn(async (_mode?: unknown) => undefined), created: jest.fn((_source?: unknown) => undefined) };

export function audioMock() {
  return {
    createAudioPlayer: (source: unknown) => {
      mockAudio.created(source);
      return { volume: 1, play: () => mockAudio.play(source), seekTo: mockAudio.seekTo, remove: () => undefined };
    },
    setAudioModeAsync: (mode: unknown) => mockAudio.setAudioMode(mode),
  };
}
