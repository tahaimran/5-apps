import { cubicBezier, Easing } from 'react-native-reanimated';

/**
 * Motion vocabulary (plan §7, expo-animation). The selection pill follows the finger through shared
 * values set by the gesture on the UI thread; found pills draw in with a shared value (SVG props have no
 * CSS animation). Everything else is a CSS transition (state changes) or CSS keyframes (one-shot
 * effects). Everything the player causes finishes in under 300 ms. Reduce Motion drops movement and the
 * confetti; colors and opacity still change. No tab, scroll or settings toggle animates.
 */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
export const CSS_EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1);
/** For withTiming. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** A small state change: a chip filling, a card's edge, a toggle row. */
export const STATE_MS = 180;
/** A found word's pill draws itself from the first letter to the last. */
export const DRAW_MS = 240;
/** A selection that is not a word fades away (no shake, no red, no buzz: plan §5.3). */
export const FADE_MS = 200;

/** The board settles in once when a puzzle opens. */
export const GRID_IN = {
  '0%': { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.98 }] },
  '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};
export const GRID_IN_MS = 280;

/** A word chip ticks when its word is found: one small bounce. */
export const CHIP_TICK = {
  '0%': { transform: [{ scale: 1 }] },
  '45%': { transform: [{ scale: 1.1 }] },
  '100%': { transform: [{ scale: 1 }] },
};
export const TICK_MS = 240;

/** A star lands: up from 0.6 with a little overshoot, one after another (plan §5.4). */
export const STAR_POP = {
  '0%': { opacity: 0, transform: [{ scale: 0.6 }, { rotate: '-12deg' }] },
  '60%': { opacity: 1, transform: [{ scale: 1.15 }, { rotate: '4deg' }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }] },
};
export const STAR_MS = 280;
export const STAR_GAP_MS = 220;
/** The first star waits for the title to land. */
export const STAR_LEAD_MS = 260;

/** Cards and the Complete title arrive once: up 12dp while fading in. */
export const RISE_IN = {
  '0%': { opacity: 0, transform: [{ translateY: 12 }] },
  '100%': { opacity: 1, transform: [{ translateY: 0 }] },
};
export const RISE_MS = 260;

/** The rays behind the stars open once (never spin: nothing loops on the finish screen). */
export const BURST_IN = {
  '0%': { opacity: 0, transform: [{ scale: 0.9 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};
export const BURST_MS = 280;

/** The streak flame on a counted daily: a warm pop after the stars. */
export const FLAME_POP = {
  '0%': { opacity: 0, transform: [{ scale: 0.7 }] },
  '60%': { opacity: 1, transform: [{ scale: 1.18 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};
export const FLAME_MS = 280;

/**
 * The hint ring breathes for the 3 s it is shown (plan §8.5), so the eye finds it; under Reduce Motion
 * it is a still, thick ring. The beat is short; the rest of each cycle is still.
 */
export const HINT_PULSE = {
  '0%': { opacity: 1, transform: [{ scale: 1 }] },
  '25%': { opacity: 0.55, transform: [{ scale: 1.14 }] },
  '50%': { opacity: 1, transform: [{ scale: 1 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};
export const HINT_PULSE_MS = 1000;

/** Confetti on Puzzle Complete only, and only with Reduce Motion off. */
export const CONFETTI_MS = 1600;
