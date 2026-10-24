import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Switch, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import { t } from '@shared/i18n';
import { useTheme, type Palette, type ThemeMode } from '@shared/theme';
import { Button, PressableScale, type IconComponent } from '@shared/ui';
import { HabitIcon } from './icons';

const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/**
 * An inset track with a raised part on top (segment pill, stepper buttons). In dark mode a raised
 * part must be lighter than its track, not darker, or it reads as pressed in.
 */
const insetTones = (colors: Palette, mode: ThemeMode) =>
  mode === 'light' ? { track: colors.surfaceAlt, raised: colors.surface } : { track: colors.background, raised: colors.surfaceAlt };

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      {children}
      {hint && !error ? <Text style={[type.caption, { color: colors.textMuted }]}>{hint}</Text> : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[type.caption, { color: colors.danger, fontWeight: '600' }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export interface TextFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  label: string;
  placeholder?: string;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  invalid?: boolean;
  multiline?: boolean;
}

export function TextField({ value, onChangeText, label, placeholder, maxLength, keyboardType, invalid, multiline }: TextFieldProps) {
  const { colors, radius, type, touchTarget } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      maxLength={maxLength}
      keyboardType={keyboardType}
      multiline={multiline}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      cursorColor={colors.primary}
      selectionColor={colors.primary + '55'}
      style={[
        type.bodyLarge,
        {
          color: colors.text,
          backgroundColor: colors.surface,
          borderColor: invalid ? colors.danger : focused ? colors.primary : colors.border,
          borderWidth: focused || invalid ? 2 : 1,
          borderRadius: radius.md + 2,
          minHeight: touchTarget + 6,
          paddingHorizontal: 16,
          paddingVertical: 10,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
    />
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** A Lucide component, or a stored habit icon name. */
  icon?: IconComponent | string;
}) {
  const { colors, radius, type, touchTarget } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  const Icon = typeof icon === 'string' ? null : icon;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.94}
      style={[
        styles.chip,
        {
          minHeight: touchTarget,
          minWidth: touchTarget,
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      {typeof icon === 'string' ? <HabitIcon name={icon} size={18} color={fg} /> : Icon ? <Icon size={18} color={fg} strokeWidth={2.25} /> : null}
      <Text style={[type.body, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </PressableScale>
  );
}

/** Radio group with a sliding pill under the selected option. */
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
  // The first placement jumps; only later changes slide (a state change, so a CSS transition).
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

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  format = String,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  format?: (v: number) => string;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const { colors, radius, type, touchTarget, mode } = useTheme();
  const { track, raised } = insetTones(colors, mode);
  const btn = { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={[styles.stepper, { borderRadius: radius.pill, backgroundColor: track }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
        scaleTo={0.88}
        style={[btn, { backgroundColor: raised, opacity: value <= min ? 0.35 : 1 }]}
      >
        <Minus size={20} color={colors.text} strokeWidth={2.5} />
      </PressableScale>
      <Text
        accessibilityLabel={`${label} ${format(value)}`}
        style={[type.bodyLarge, { color: colors.text, fontWeight: '700', minWidth: 72, textAlign: 'center', paddingHorizontal: 8 }]}
      >
        {format(value)}
      </Text>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + step))}
        scaleTo={0.88}
        style={[btn, { backgroundColor: raised, opacity: value >= max ? 0.35 : 1 }]}
      >
        <Plus size={20} color={colors.text} strokeWidth={2.5} />
      </PressableScale>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: IconComponent }) {
  return <Button label={label} onPress={onPress} disabled={disabled} icon={icon} />;
}

export function TextButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Button label={label} onPress={onPress} variant={danger ? 'danger' : 'ghost'} block={false} />;
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderWidth: 1, justifyContent: 'center' },
  segmented: { flexDirection: 'row', padding: 4 },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 4 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', padding: 4, gap: 4 },
});

/** A Switch whose thumb stays visible on dark surfaces (the platform default goes dark-on-dark). */
export function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  const { colors, mode } = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: colors.primary, false: mode === 'light' ? colors.border : colors.surfaceAlt }}
      thumbColor={value || mode === 'light' ? '#FFFFFF' : colors.textMuted}
    />
  );
}
