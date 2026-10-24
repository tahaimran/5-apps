import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Square from 'lucide-react-native/icons/square';
import TimerIcon from 'lucide-react-native/icons/timer';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import { useAppColors } from '@/theme/mode';
import { TIMER_BUTTON } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BREATH, BREATH_MS, CSS_BREATH, CSS_EASE_OUT, FILL_MS } from '@/ui/motion';

/** Plan §5.1: the long press that opens "Undo last tap". */
export const UNDO_PRESS_MS = 600;
export { BREATH_MS };

/** The button's diameter in dp: 220 by default (280 in Partner mode), never under 120, never wider than the screen allows. */
export function timerButtonSize(width: number, height: number, partner: boolean): number {
  const wanted = partner ? TIMER_BUTTON.partner : TIMER_BUTTON.default;
  return Math.round(Math.max(TIMER_BUTTON.min, Math.min(wanted, width - 72, height * 0.4)));
}

/** Room around the button for the still track and the breathing ring. */
export const RING_GAP = 22;

/**
 * The label's size in sp: the theme's display size, shrunk only as far as needed for the word to fit
 * inside the disc at the phone's font scale (so 200% text never spills out of the circle).
 */
export function labelSize(want: number, diameter: number, chars: number, fontScale: number): number {
  const fits = (diameter * 0.7) / (Math.max(chars, 4) * 0.6 * fontScale);
  return Math.max(18, Math.round(Math.min(want, fits)));
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
 * The giant Start / Stop button (plan §5.1 and §7): a teal disc with a timer icon and "Start", or a coral
 * disc with a square and "Stop". The two fills crossfade (a CSS transition), a still ring circles the
 * disc, and while a contraction runs a coral ring breathes around it, 4 s in and 4 s out, as a breathing
 * guide (a looping CSS keyframe; drawn still with Reduce Motion). Label and icon change too, so color is
 * never the only signal.
 */
export function TimerButton({ running, spokenElapsed, partner, onPress, onLongPress, onTouch }: TimerButtonProps) {
  const { type, fonts, shadow } = useTheme();
  const app = useAppColors();
  const reduced = useReducedMotion();
  const { width, height, fontScale } = useWindowDimensions();
  const size = timerButtonSize(width, height, !!partner);
  const ring = size + 2 * RING_GAP;
  const word = running ? t('timer.stop') : t('timer.start');
  const fontSize = labelSize(Math.round(type.display.fontSize * (partner ? 1.2 : 1)), size, word.length, fontScale);
  const fg = running ? app.onStop : app.onStart;
  const Icon = running ? Square : TimerIcon;
  const fade = { transitionProperty: 'opacity' as const, transitionDuration: reduced ? 0 : FILL_MS, transitionTimingFunction: CSS_EASE_OUT };
  return (
    <View style={[styles.center, { width: ring, height: ring, alignSelf: 'center' }]}>
      <View pointerEvents="none" style={[styles.abs, { width: ring - 8, height: ring - 8, borderRadius: ring / 2, borderWidth: 2, borderColor: app.track }]} />
      {running ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.abs,
            { width: ring, height: ring, borderRadius: ring / 2, borderWidth: 5, borderColor: app.ring },
            reduced
              ? { opacity: 0.7 }
              : { animationName: BREATH, animationDuration: BREATH_MS * 2, animationIterationCount: 'infinite', animationTimingFunction: CSS_BREATH },
          ]}
        />
      ) : null}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={running ? t('timer.stopLabel', { time: spokenElapsed }) : t('timer.startLabel')}
        accessibilityHint={t('timer.buttonHint')}
        hitSlop={TIMER_BUTTON.hitSlop}
        delayLongPress={UNDO_PRESS_MS}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => onTouch?.(true)}
        onPressOut={() => onTouch?.(false)}
        scaleTo={0.97}
        style={[{ width: size, height: size, borderRadius: size / 2 }, shadow(3)]}
      >
        <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, overflow: 'hidden' }]}>
          <LinearGradient colors={app.start} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: running ? 1 : 0 }, fade]}>
            <LinearGradient colors={app.stop} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          {/* A soft highlight across the top, so the disc reads as something you can press. */}
          <LinearGradient colors={[app.sheen, `${app.sheen.slice(0, 7)}00`]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={StyleSheet.absoluteFill} />
        </View>
        <View style={[StyleSheet.absoluteFill, styles.center, { gap: 6 }]}>
          <Icon size={Math.round(size * 0.13)} color={fg} strokeWidth={2.5} fill={running ? fg : 'none'} />
          <AppText style={{ fontSize, lineHeight: Math.round(fontSize * 1.15), color: fg, fontFamily: fonts.display, fontWeight: '800' }}>{word}</AppText>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute' },
});
