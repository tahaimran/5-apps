import { cubicBezier } from 'react-native-reanimated';

/**
 * Motion vocabulary (plan §7, expo-animation). CSS transitions for state changes, CSS keyframes for
 * one-shot or looping effects; shared values only inside the shared kit (press scale, the progress
 * ring). Everything the user causes finishes in under 300 ms. The one exception is the breathing ring,
 * which loops slowly on purpose (it is a breathing guide). Reduce Motion drops movement; colors and
 * opacity still change.
 */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
export const CSS_EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1);
/** A breath has no snap: a symmetric, gentle sine-like curve. */
export const CSS_BREATH = cubicBezier(0.37, 0, 0.63, 1);

/** A small state change: a chip filling, a checkbox ticking. */
export const STATE_MS = 180;
/** The giant button crossfading teal ↔ coral, and the page wash warming or cooling with it. */
export const FILL_MS = 240;
export const WASH_MS = 280;

/** Plan §7: the ring breathes in for 4 s and out for 4 s while a contraction runs. */
export const BREATH_MS = 4000;
export const BREATH = {
  '0%': { opacity: 0.45, transform: [{ scale: 1 }] },
  '50%': { opacity: 0.9, transform: [{ scale: 1.1 }] },
  '100%': { opacity: 0.45, transform: [{ scale: 1 }] },
};

/**
 * A kick counted: the number gives one small pop. Two copies so changing the name replays it on
 * every tap (React Native restarts a CSS animation when its name changes).
 */
const pop = (peak: number) => ({
  '0%': { transform: [{ scale: 1 }] },
  '40%': { transform: [{ scale: peak }] },
  '100%': { transform: [{ scale: 1 }] },
});
export const KICK_POP = [pop(1.12), pop(1.1201)] as const;
export const POP_MS = 220;

/** The pattern banner (and other calm cards) arrive once: up 12dp while fading in. */
export const RISE_IN = {
  '0%': { opacity: 0, transform: [{ translateY: 12 }] },
  '100%': { opacity: 1, transform: [{ translateY: 0 }] },
};
export const RISE_MS = 260;
