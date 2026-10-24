import { cubicBezier } from 'react-native-reanimated';

/**
 * Motion vocabulary (plan §7, expo-animation): CSS transitions for state changes, CSS keyframes for
 * one-shot or looping effects, shared values only for the timer ring. Everything the user causes
 * finishes in under 300 ms, and Reduce Motion drops the movement (colors and opacity still change).
 */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/** A state change (an answer filling green or red, a pill moving). */
export const STATE_MS = 180;

/** Plan §7: a wrong answer shakes three times in 240 ms. */
export const SHAKE = {
  '0%': { transform: [{ translateX: 0 }] },
  '17%': { transform: [{ translateX: -9 }] },
  '33%': { transform: [{ translateX: 8 }] },
  '50%': { transform: [{ translateX: -7 }] },
  '67%': { transform: [{ translateX: 6 }] },
  '83%': { transform: [{ translateX: -3 }] },
  '100%': { transform: [{ translateX: 0 }] },
};
export const SHAKE_MS = 240;

/** The right answer gives one small bounce. */
export const POP = {
  '0%': { transform: [{ scale: 1 }] },
  '45%': { transform: [{ scale: 1.035 }] },
  '100%': { transform: [{ scale: 1 }] },
};

/** A star lands: up from 0.6 with a little overshoot. Plan §7: stars pop 150 ms apart. */
export const STAR_POP = {
  '0%': { opacity: 0, transform: [{ scale: 0.6 }] },
  '60%': { opacity: 1, transform: [{ scale: 1.15 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};
export const STAR_GAP_MS = 150;

/**
 * A soft beat (the last seconds of the timer, the current Classic level). Two copies so changing the
 * name replays it: React Native restarts a CSS animation when its name changes.
 */
const beat = (peak: number) => ({
  '0%': { transform: [{ scale: 1 }] },
  '40%': { transform: [{ scale: peak }] },
  '100%': { transform: [{ scale: 1 }] },
});
export const BEAT = [beat(1.12), beat(1.1201)] as const;

/**
 * The current level's halo: a ring pings out in the first 300 ms of each 1.6 s cycle and rests for
 * the remainder, so the motion itself stays short while the cue keeps coming back.
 */
export const PING = {
  '0%': { opacity: 0.55, transform: [{ scale: 1 }] },
  '18%': { opacity: 0, transform: [{ scale: 1.35 }] },
  '100%': { opacity: 0, transform: [{ scale: 1.35 }] },
};
export const PING_MS = 1600;
