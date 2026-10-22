import React, { useEffect, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

/** Strong ease-out for anything entering or responding (never ease-in on UI). */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** On-screen movement and morphing. */
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/** Any icon component with the lucide-react-native props (size, color, strokeWidth). */
export type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Scale while pressed. Default 0.96; use ~0.98 for big cards. */
  scaleTo?: number;
}

/**
 * Pressable that dips on press-in and springs back on release, on the UI thread. Under reduced
 * motion it dims instead of scaling.
 */
export function PressableScale({ scaleTo = 0.96, style, onPressIn, onPressOut, children, ...rest }: PressableScaleProps) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => {
    const p = pressed.get();
    return reduced ? { opacity: 1 - p * 0.3 } : { transform: [{ scale: 1 - (1 - scaleTo) * p }] };
  });
  const pressIn = (e: GestureResponderEvent) => {
    pressed.set(withTiming(1, { duration: 110, easing: EASE_OUT }));
    onPressIn?.(e);
  };
  const pressOut = (e: GestureResponderEvent) => {
    pressed.set(reduced ? withTiming(0, { duration: 150 }) : withSpring(0, { duration: 380, dampingRatio: 0.55 }));
    onPressOut?.(e);
  };
  return (
    <AnimatedPressable {...rest} onPressIn={pressIn} onPressOut={pressOut} pressRetentionOffset={16} style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  /** 0…1; values outside are clamped. */
  progress: number;
  color: string;
  trackColor: string;
  /** Shown centered inside the ring. */
  children?: ReactNode;
  /** Sweep duration when the progress changes. */
  duration?: number;
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** Circular progress that sweeps to its new value. Decorative: label the parent for screen readers. */
export function ProgressRing({ size, strokeWidth, progress, color, trackColor, children, duration = 650 }: ProgressRingProps) {
  const reduced = useReducedMotion();
  const target = clamp01(progress);
  const value = useSharedValue(reduced ? target : 0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    value.set(reduced ? target : withTiming(target, { duration, easing: EASE_OUT }));
  }, [target, reduced, duration, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - value.get()),
    // A round cap would leave a dot at 0%.
    strokeOpacity: value.get() > 0.002 ? 1 : 0,
  }));

  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      {children !== undefined && <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>}
    </View>
  );
}

/** A raised surface: the app's card background, large radius and a soft shadow. */
export function Card({ children, style, level = 1, padded = true }: { children?: ReactNode; style?: StyleProp<ViewStyle>; level?: 0 | 1 | 2 | 3; padded?: boolean }) {
  const { colors, radius, spacing, shadow } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: padded ? spacing.lg : 0 }, shadow(level), style]}>
      {children}
    </View>
  );
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconComponent;
  disabled?: boolean;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  /** Fills the available width. Default true for primary. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', icon: Icon, disabled, loading, block, style, accessibilityHint }: ButtonProps) {
  const { colors, radius, type, touchTarget, shadow } = useTheme();
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.primary;
  const bg = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.primarySoft : 'transparent';
  const inactive = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          minHeight: variant === 'ghost' ? touchTarget : Math.max(touchTarget, 54),
          alignSelf: (block ?? variant === 'primary') ? 'stretch' : 'auto',
          opacity: disabled ? 0.4 : 1,
        },
        variant === 'primary' && !disabled ? shadow(2) : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon && <Icon size={20} color={fg} strokeWidth={2.25} />}
          <Text style={[type.bodyLarge, { color: fg, fontWeight: '700' }]}>{label}</Text>
        </>
      )}
    </PressableScale>
  );
}

export interface IconButtonProps {
  icon: IconComponent;
  /** Required: icon-only buttons need a spoken name. */
  label: string;
  onPress: () => void;
  variant?: 'plain' | 'tonal' | 'solid';
  /** Icon color; defaults by variant. */
  color?: string;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon: Icon, label, onPress, variant = 'plain', color, size = 22, disabled, style }: IconButtonProps) {
  const { colors, touchTarget } = useTheme();
  const fg = color ?? (variant === 'solid' ? colors.onPrimary : variant === 'tonal' ? colors.primary : colors.text);
  const bg = variant === 'solid' ? colors.primary : variant === 'tonal' ? colors.primarySoft : 'transparent';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      scaleTo={0.9}
      style={[
        styles.center,
        { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, backgroundColor: bg, opacity: disabled ? 0.35 : 1 },
        style,
      ]}
    >
      <Icon size={size} color={fg} strokeWidth={2.25} />
    </PressableScale>
  );
}

// ---- Toast -------------------------------------------------------------------------------------

export interface ToastInput {
  message: string;
  icon?: IconComponent;
  tone?: 'default' | 'success' | 'warning';
  /** e.g. Undo. The toast closes after the action runs. */
  action?: { label: string; onPress: () => void };
  /** ms; default 2600, or 4500 with an action. */
  duration?: number;
}

interface ToastState extends ToastInput {
  id: number;
}

let current: ToastState | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(input: ToastInput): void {
  if (timer) clearTimeout(timer);
  current = { ...input, id: nextId++ };
  AccessibilityInfo.announceForAccessibility(input.message);
  emit();
  timer = setTimeout(hideToast, input.duration ?? (input.action ? 4500 : 2600));
}

export function hideToast(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  current = null;
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const snapshot = () => current;

/** Mount once near the root. `bottom` lifts it above a tab bar or banner. */
export function ToastHost({ bottom = 24 }: { bottom?: number }) {
  const { colors, radius, spacing, type, shadow, mode } = useTheme();
  const toast = useSyncExternalStore(subscribe, snapshot, snapshot);
  const reduced = useReducedMotion();
  if (!toast) return null;
  const Icon = toast.icon;
  // Inverse surface: dark on a light screen, raised on a dark one.
  const bg = mode === 'light' ? colors.text : colors.surfaceAlt;
  const fg = mode === 'light' ? colors.background : colors.text;
  const iconColor = toast.tone === 'success' ? colors.success : toast.tone === 'warning' ? colors.accent : fg;
  return (
    <View style={[StyleSheet.absoluteFill, styles.toastLayer]} pointerEvents="box-none">
      <Animated.View
        key={toast.id}
        entering={reduced ? undefined : FadeInDown.duration(240).easing(EASE_OUT)}
        exiting={reduced ? undefined : FadeOutDown.duration(160)}
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          { bottom, backgroundColor: bg, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md },
          shadow(3),
        ]}
      >
        {Icon && <Icon size={20} color={iconColor} strokeWidth={2.25} />}
        <Text style={[type.body, { color: fg, flex: 1, fontWeight: '600' }]}>{toast.message}</Text>
        {toast.action && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
            hitSlop={12}
            onPress={() => {
              toast.action?.onPress();
              hideToast();
            }}
          >
            <Text style={[type.body, { color: mode === 'light' ? colors.primarySoft : colors.primary, fontWeight: '700' }]}>{toast.action.label}</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  ringSvg: { transform: [{ rotate: '-90deg' }] },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  toastLayer: { justifyContent: 'flex-end' },
  toast: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
});
