import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@shared/theme';
import { extraColorsFor } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** 0..1 (values above 1 are drawn as a full ring). */
  fraction: number;
  size: number;
  stroke?: number;
  /** The goal is reached: the ring turns the success color. */
  done?: boolean;
  /** Spoken description of the progress. */
  label: string;
  /** Numeric progress for `accessibilityValue`. */
  percent: number;
  children?: ReactNode;
}

/**
 * The progress ring (plan §5.1): the arc sweeps with a spring (damping 18, ~600 ms) when the value
 * changes, and jumps straight there under reduced motion. Exposed as a progressbar.
 */
export function ProgressRing({ fraction, size, stroke = 16, done, label, percent, children }: ProgressRingProps) {
  const { colors, mode } = useTheme();
  const extra = extraColorsFor(mode);
  const reduced = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, fraction));
  const progress = useSharedValue(clamped);
  useEffect(() => {
    progress.value = reduced ? clamped : withSpring(clamped, { damping: 18 });
  }, [clamped, reduced, progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.min(100, percent), text: label }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={done ? colors.success : extra.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          animatedProps={animatedProps}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}
