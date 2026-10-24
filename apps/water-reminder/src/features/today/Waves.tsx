import { StyleSheet, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { WAVE_ALPHA } from '@/theme/tokens';

const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
/** Water never sits fully empty or brim-full: a sliver shows at 0%, a little air stays at 100%. */
const LEVEL_MIN = 0.12;
const LEVEL_MAX = 0.86;

/** Where the surface sits, 0 (bottom) … 1 (top), for a goal fraction. */
export const waterLevel = (fraction: number) => LEVEL_MIN + (LEVEL_MAX - LEVEL_MIN) * Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));

/**
 * One period-`width` sine wave repeated twice (so sliding left by `width` loops seamlessly), filled
 * down to `height`.
 */
export function wavePath(width: number, height: number, amplitude: number, phase = 0): string {
  const steps = 24;
  let d = `M0 ${height} L0 ${amplitude + amplitude * Math.sin(phase)}`;
  for (let i = 1; i <= steps * 2; i++) {
    const x = (i / steps) * width;
    const y = amplitude + amplitude * Math.sin(phase + (i / steps) * Math.PI * 2);
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${width * 2} ${height} Z`;
}

const drift = (width: number) => ({
  from: { transform: [{ translateX: 0 }] },
  to: { transform: [{ translateX: -width }] },
});

/**
 * The hero's water: two translucent waves whose surface rises with today's progress. The level is
 * a state change (a CSS transition on transform); the sideways drift is a constant loop (a CSS
 * animation) and stops under reduced motion. Decorative only.
 */
export function Waves({ width, height, fraction }: { width: number; height: number; fraction: number }) {
  const reduced = useReducedMotion();
  if (width <= 0 || height <= 0) return null;
  const top = height * (1 - waterLevel(fraction));
  const layer = (alpha: number, amplitude: number, phase: number, seconds: number) => (
    <Animated.View
      style={[
        styles.layer,
        { width: width * 2, height },
        reduced
          ? null
          : {
              animationName: drift(width),
              animationDuration: `${seconds}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
            },
      ]}
    >
      <Svg width={width * 2} height={height}>
        <Path d={wavePath(width, height, amplitude, phase)} fill="#FFFFFF" fillOpacity={alpha} />
      </Svg>
    </Animated.View>
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateY: top }],
            transitionProperty: 'transform',
            transitionDuration: reduced ? 0 : 280,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      >
        {layer(WAVE_ALPHA.back, 9, Math.PI / 2, 9)}
        {layer(WAVE_ALPHA.front, 7, 0, 6)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
