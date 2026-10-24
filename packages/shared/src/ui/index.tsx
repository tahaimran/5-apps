import React, { useEffect, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import Animated, {
  cubicBezier,
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
import { t } from '../i18n';
import { useHaptics, useTheme, type Palette, type ThemeMode } from '../theme';

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

// ---- Form controls -----------------------------------------------------------------------------

/** CSS-transition curve matching EASE_OUT (state changes use CSS transitions, not shared values). */
const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/**
 * An inset track with a raised part on top (segment pill, stepper buttons). In dark mode a raised
 * part must be lighter than its track, not darker, or it reads as pressed in.
 */
export const insetTones = (colors: Palette, mode: ThemeMode) =>
  mode === 'light' ? { track: colors.surfaceAlt, raised: colors.surface } : { track: colors.background, raised: colors.surfaceAlt };

/** A Switch whose thumb stays visible on dark surfaces (the platform default goes dark-on-dark). */
export function Toggle({ value, onValueChange, label, disabled }: { value: boolean; onValueChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const { colors, mode } = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      trackColor={{ true: colors.primary, false: mode === 'light' ? colors.border : colors.surfaceAlt }}
      thumbColor={value || mode === 'light' ? '#FFFFFF' : colors.textMuted}
    />
  );
}

/** Radio group with a pill that slides under the selected option (a CSS transition, so it never sticks). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors, radius, type, touchTarget, shadow, mode } = useTheme();
  const reduced = useReducedMotion();
  const { track, raised } = insetTones(colors, mode);
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width > 0 ? (width - 8) / options.length : 0;
  // The first placement jumps; only later changes slide.
  const placed = useRef(false);
  useEffect(() => {
    if (segment > 0) placed.current = true;
  }, [segment]);
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.segmented, { backgroundColor: track, borderRadius: radius.md + 4 }]}
      accessibilityRole="radiogroup"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          { width: segment, opacity: segment > 0 ? 1 : 0, borderRadius: radius.md, backgroundColor: raised },
          shadow(1),
          {
            transform: [{ translateX: index * segment }],
            transitionProperty: 'transform',
            transitionDuration: placed.current && !reduced ? 220 : 0,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      />
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <PressableScale
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            scaleTo={0.96}
            style={[styles.segment, { minHeight: touchTarget }]}
          >
            <Text style={[type.body, { color: selected ? colors.text : colors.textMuted, fontWeight: selected ? '700' : '500' }]} numberOfLines={1}>
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  /** A fixed step, or one that depends on the value and direction (e.g. 10 ml below 100, 50 above). */
  step?: number | ((value: number, direction: 1 | -1) => number);
  label: string;
  format?: (v: number) => string;
  decreaseLabel?: string;
  increaseLabel?: string;
  /** Makes the value tappable (e.g. to type an exact amount). */
  onPressValue?: () => void;
  valueHint?: string;
}

/** Snaps to the step grid, so 237 + 50 lands on 250 (not 287) and 250 − 50 on 200. */
export function stepValue(value: number, size: number, direction: 1 | -1): number {
  return direction > 0 ? Math.floor(value / size) * size + size : Math.ceil(value / size) * size - size;
}

/** −  value  + on an inset pill track; the raised buttons follow the dark-mode inset rule. */
export function Stepper({ value, onChange, min, max, step = 1, label, format = String, decreaseLabel, increaseLabel, onPressValue, valueHint }: StepperProps) {
  const { colors, radius, type, touchTarget, mode } = useTheme();
  const haptics = useHaptics();
  const { track, raised } = insetTones(colors, mode);
  const move = (direction: 1 | -1) => {
    const size = typeof step === 'number' ? step : step(value, direction);
    void haptics.select();
    onChange(Math.min(max, Math.max(min, stepValue(value, size, direction))));
  };
  const btn = { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2 };
  const text = (
    <Text style={[type.bodyLarge, styles.stepperValue, { color: colors.text }]} numberOfLines={1}>
      {format(value)}
    </Text>
  );
  return (
    <View style={[styles.stepper, { borderRadius: radius.pill, backgroundColor: track }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel ?? t('shared.controls.decrease', { label })}
        disabled={value <= min}
        onPress={() => move(-1)}
        scaleTo={0.88}
        style={[styles.center, btn, { backgroundColor: raised, opacity: value <= min ? 0.35 : 1 }]}
      >
        <Minus size={20} color={colors.text} strokeWidth={2.5} />
      </PressableScale>
      {onPressValue ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${label} ${format(value)}`}
          accessibilityHint={valueHint}
          onPress={onPressValue}
          scaleTo={0.96}
          style={[styles.center, styles.grow, { minHeight: touchTarget }]}
        >
          {text}
        </PressableScale>
      ) : (
        <View accessible accessibilityLabel={`${label} ${format(value)}`} style={[styles.center, styles.grow]}>
          {text}
        </View>
      )}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={increaseLabel ?? t('shared.controls.increase', { label })}
        disabled={value >= max}
        onPress={() => move(1)}
        scaleTo={0.88}
        style={[styles.center, btn, { backgroundColor: raised, opacity: value >= max ? 0.35 : 1 }]}
      >
        <Plus size={20} color={colors.text} strokeWidth={2.5} />
      </PressableScale>
    </View>
  );
}

// ---- System navigation bar ---------------------------------------------------------------------

/** Present only in builds made after expo-navigation-bar was added; older dev builds lack it. */
const NavigationBar =
  requireOptionalNativeModule('ExpoNavigationBar') !== null ? (require('expo-navigation-bar') as typeof import('expo-navigation-bar')).NavigationBar : null;

/** Light or dark system navigation buttons, following the in-app theme. */
export function SystemNavBar({ dark }: { dark: boolean }) {
  return NavigationBar ? <NavigationBar style={dark ? 'light' : 'dark'} /> : null;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  grow: { flexGrow: 1 },
  segmented: { flexDirection: 'row', padding: 4 },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 4 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4 },
  stepperValue: { fontWeight: '700', minWidth: 72, textAlign: 'center', paddingHorizontal: 8 },
  ringSvg: { transform: [{ rotate: '-90deg' }] },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  toastLayer: { justifyContent: 'flex-end' },
  toast: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
});
