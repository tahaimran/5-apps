import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, EASE_OUT, PressableScale, type IconComponent } from '@shared/ui';
import { HabitIcon } from './icons';

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
  const { colors, radius, type, touchTarget, shadow } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width > 0 ? (width - 8) / options.length : 0;
  const x = useSharedValue(index * segment);
  useEffect(() => {
    x.set(reduced || segment === 0 ? index * segment : withTiming(index * segment, { duration: 220, easing: EASE_OUT }));
  }, [index, segment, reduced, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.segmented, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md + 4 }]}
      accessibilityRole="radiogroup"
    >
      {segment > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { width: segment, borderRadius: radius.md, backgroundColor: colors.surface }, shadow(1), pill]}
        />
      )}
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
  const { colors, radius, type, touchTarget } = useTheme();
  const btn = { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={[styles.stepper, { borderRadius: radius.pill, backgroundColor: colors.surfaceAlt }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
        scaleTo={0.88}
        style={[btn, { backgroundColor: colors.surface, opacity: value <= min ? 0.35 : 1 }]}
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
        style={[btn, { backgroundColor: colors.surface, opacity: value >= max ? 0.35 : 1 }]}
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

/** Hour and minute (15-minute steps) as "HH:mm". */
export function TimeStepper({ value, onChange, label }: { value: string; onChange: (hhmm: string) => void; label: string }) {
  const { colors, type } = useTheme();
  const [hour, minute] = value.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }} accessibilityLabel={`${label} ${value}`}>
      <Stepper
        value={hour}
        min={0}
        max={23}
        label={label}
        format={pad}
        onChange={(h) => onChange(`${pad(h)}:${pad(minute)}`)}
        decreaseLabel={t('editor.earlier')}
        increaseLabel={t('editor.later')}
      />
      <Text style={[type.title, { color: colors.textMuted }]}>:</Text>
      <Stepper
        value={minute}
        min={0}
        max={45}
        step={15}
        label={label}
        format={pad}
        onChange={(m) => onChange(`${pad(hour)}:${pad(m)}`)}
        decreaseLabel={t('editor.earlier')}
        increaseLabel={t('editor.later')}
      />
    </View>
  );
}
