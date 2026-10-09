import { useEffect } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAppColors } from '@/theme/mode';
import { TIMER_BUTTON } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

/** Plan §5.1: the long press that opens "Undo last tap". */
export const UNDO_PRESS_MS = 600;
/** Plan §7: the ring breathes over 4 seconds while a contraction runs (it doubles as a breathing guide). */
export const BREATH_MS = 4000;

/** The button's diameter in dp: 220 by default, never under 120, and never wider than the screen allows. */
export function timerButtonSize(width: number, height: number, partner: boolean): number {
  const wanted = partner ? TIMER_BUTTON.partner : TIMER_BUTTON.default;
  return Math.round(Math.max(TIMER_BUTTON.min, Math.min(wanted, width - 56, height * 0.4)));
}

export interface TimerButtonProps {
  running: boolean;
  /** Spoken time so far, for the Stop label ("42 seconds"). */
  spokenElapsed: string;
  partner?: boolean;
  onPress: () => void;
  onLongPress: () => void;
  /** A finger is on the button (so the page can stop scrolling) or was lifted. */
  onTouch?: (down: boolean) => void;
}

/**
 * The giant Start / Stop button (plan §5.1 and §7). Start is the teal "primary" button; while a contraction
 * runs it is the coral "active" one with a breathing ring (a still ring with Reduce motion). The label text
 * changes too, so color is never the only signal.
 */
export function TimerButton({ running, spokenElapsed, partner, onPress, onLongPress, onTouch }: TimerButtonProps) {
  const { colors, type } = useTheme();
  const app = useAppColors();
  const { width, height } = useWindowDimensions();
  const size = timerButtonSize(width, height, !!partner);
  const reduced = useReducedMotion();
  const breath = useSharedValue(1);
  useEffect(() => {
    if (running && !reduced) breath.value = withRepeat(withTiming(1.1, { duration: BREATH_MS / 2, easing: Easing.inOut(Easing.ease) }), -1, true);
    else breath.value = 1;
  }, [running, reduced, breath]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const ring = size + 36;
  return (
    <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      {running ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={[{ position: 'absolute', width: ring, height: ring, borderRadius: ring / 2, borderWidth: 4, borderColor: app.active }, ringStyle]}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={running ? t('timer.stopLabel', { time: spokenElapsed }) : t('timer.startLabel')}
        accessibilityHint={t('timer.buttonHint')}
        hitSlop={TIMER_BUTTON.hitSlop}
        delayLongPress={UNDO_PRESS_MS}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => onTouch?.(true)}
        onPressOut={() => onTouch?.(false)}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: colors.text,
          backgroundColor: running ? app.active : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <AppText style={{ fontSize: Math.round(type.display.fontSize * (partner ? 1.3 : 1.1)), fontWeight: '700', color: running ? app.onActive : colors.onPrimary }}>
          {running ? t('timer.stop') : t('timer.start')}
        </AppText>
      </Pressable>
    </View>
  );
}
