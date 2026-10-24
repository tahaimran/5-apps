import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BEAT, CSS_EASE_OUT } from '@/ui/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** The last seconds turn the ring red and make the number beat (plan §5). */
const LOW_SECONDS = 5;

export interface TimerRingProps {
  msLeft: number;
  msTotal: number;
  /** The clock is counting (not paused, not on the explanation). */
  running: boolean;
  /** Changes when a new question starts, so the sweep restarts from full. */
  resetKey: string;
  size?: number;
}

/**
 * The countdown ring (plan §5). The sweep is the one continuous animation in the app, so it is a shared
 * value: when the clock starts it runs linearly to empty on the UI thread over the time left, and it
 * freezes where it is when the clock stops. The number in the middle is text, so the time is never
 * shown by the ring alone; the spoken label changes only every 5 seconds so TalkBack is not chattering.
 */
export function TimerRing({ msLeft, msTotal, running, resetKey, size = 64 }: TimerRingProps) {
  const { colors, mode } = useTheme();
  const x = extraColorsFor(mode);
  const reduced = useReducedMotion();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = msTotal > 0 ? Math.max(0, Math.min(1, msLeft / msTotal)) : 0;
  const progress = useSharedValue(fraction);

  // Restart only when the clock starts or stops, a question changes or extra time arrives; not every tick.
  useEffect(() => {
    cancelAnimation(progress);
    progress.set(fraction);
    if (running && msLeft > 0) progress.set(withTiming(0, { duration: msLeft, easing: Easing.linear }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- msLeft is read at the restart moment only
  }, [running, msTotal, resetKey, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.get()),
    strokeOpacity: progress.get() > 0.002 ? 1 : 0,
  }));

  const seconds = Math.ceil(msLeft / 1000);
  const low = seconds <= LOW_SECONDS;
  const spoken = Math.ceil(seconds / 5) * 5;
  const tint = low ? colors.danger : colors.primary;
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={t('quiz.timeLeft', { seconds: spoken })}
      style={[styles.box, { width: size, height: size, borderRadius: size / 2, backgroundColor: x.card }]}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={x.cardTrack} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tint}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      <Animated.View
        style={
          low && running && !reduced
            ? { animationName: BEAT[seconds % 2], animationDuration: '220ms', animationTimingFunction: CSS_EASE_OUT }
            : null
        }
      >
        <AppText variant="h2" style={{ color: low ? colors.danger : colors.text, fontWeight: '800' }}>
          {String(seconds)}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
});
