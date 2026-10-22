import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { EASE_OUT, PressableScale } from '@shared/ui';
import { readableOn } from '@/theme/contrast';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_PATH = 'M7 12.5l3.4 3.4L17.2 9';
const CHECK_LENGTH = 17;

/**
 * The yes/no check-off. Turning done: the circle fills with a spring, the check mark draws itself
 * and a ring bursts outward once. Undoing just fades back. Under reduced motion it only fades.
 */
export function CheckButton({ checked, color, onPress }: { checked: boolean; color: string; onPress: () => void }) {
  const { colors, touchTarget } = useTheme();
  const reduced = useReducedMotion();
  const fill = useSharedValue(checked ? 1 : 0);
  const draw = useSharedValue(checked ? 1 : 0);
  const burst = useSharedValue(0);
  const was = useRef(checked);

  useEffect(() => {
    if (checked === was.current) return;
    was.current = checked;
    if (reduced) {
      fill.set(withTiming(checked ? 1 : 0, { duration: 150 }));
      draw.set(checked ? 1 : 0);
      return;
    }
    if (checked) {
      fill.set(withSpring(1, { duration: 420, dampingRatio: 0.55 }));
      draw.set(withDelay(70, withTiming(1, { duration: 220, easing: EASE_OUT })));
      burst.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 520, easing: EASE_OUT })));
    } else {
      draw.set(withTiming(0, { duration: 120 }));
      fill.set(withTiming(0, { duration: 180, easing: EASE_OUT }));
    }
  }, [checked, reduced, fill, draw, burst]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, fill.get() * 1.4),
    transform: [{ scale: 0.55 + 0.45 * fill.get() }],
  }));
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.get() === 0 ? 0 : 0.55 * (1 - burst.get()),
    transform: [{ scale: 1 + 0.75 * burst.get() }],
  }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - draw.get()) }));

  const size = touchTarget;
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityLabel={t(checked ? 'today.uncheck' : 'today.check')}
      accessibilityState={{ checked }}
      onPress={onPress}
      scaleTo={0.88}
      hitSlop={6}
      style={[styles.center, round]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, round, { borderWidth: 3, borderColor: color }, burstStyle]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, round, { borderWidth: 2.5, borderColor: colors.border }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, round, { backgroundColor: color }, fillStyle]} />
      <Svg width={26} height={26} viewBox="0 0 24 24" pointerEvents="none">
        <AnimatedPath
          d={CHECK_PATH}
          stroke={readableOn(color)}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`}
          animatedProps={checkProps}
        />
      </Svg>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
