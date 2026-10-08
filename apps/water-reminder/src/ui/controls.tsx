import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' }]}>{label}</Text>
      {children}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[type.caption, { color: colors.danger }]}>
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
}

export function TextField({ value, onChangeText, label, placeholder, maxLength, keyboardType, invalid }: TextFieldProps) {
  const { colors, radius, type, touchTarget } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      maxLength={maxLength}
      keyboardType={keyboardType}
      style={[
        type.body,
        {
          color: colors.text,
          backgroundColor: colors.surface,
          borderColor: invalid ? colors.danger : colors.border,
          borderWidth: 1,
          borderRadius: radius.md,
          minHeight: touchTarget,
          paddingHorizontal: 12,
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
  icon?: string;
}) {
  const { colors, radius, type, touchTarget } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
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
      {icon ? <MaterialCommunityIcons name={icon as never} size={18} color={fg} /> : null}
      <Text style={[type.body, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors, radius, type, touchTarget } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.segment, { minHeight: touchTarget, borderRadius: radius.md - 2, backgroundColor: selected ? colors.surface : 'transparent' }]}
          >
            <Text style={[type.body, { color: selected ? colors.text : colors.textMuted, fontWeight: selected ? '700' : '500' }]}>{o.label}</Text>
          </Pressable>
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
  const btn = { width: touchTarget, height: touchTarget, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={[styles.stepper, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
        style={[btn, { opacity: value <= min ? 0.3 : 1 }]}
      >
        <MaterialCommunityIcons name="minus" size={22} color={colors.text} />
      </Pressable>
      <Text accessibilityLabel={`${label} ${format(value)}`} style={[type.bodyLarge, { color: colors.text, fontWeight: '700', minWidth: 64, textAlign: 'center' }]}>
        {format(value)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + step))}
        style={[btn, { opacity: value >= max ? 0.3 : 1 }]}
      >
        <MaterialCommunityIcons name="plus" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { colors, radius, type, touchTarget } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        minHeight: Math.max(touchTarget, 52),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={[type.bodyLarge, { color: colors.onPrimary, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const { colors, type, touchTarget } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ minHeight: touchTarget, minWidth: touchTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}
    >
      <Text style={[type.body, { color: danger ? colors.danger : colors.primary, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderWidth: 1, justifyContent: 'center' },
  segmented: { flexDirection: 'row', padding: 2 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, alignSelf: 'flex-start' },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
});

/** A time of day in minutes from midnight, as hour and minute (15-minute steps) steppers. */
export function MinuteStepper({ value, onChange, label }: { value: number; onChange: (minute: number) => void; label: string }) {
  const { colors, type } = useTheme();
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLabel={`${label} ${pad(hour)}:${pad(minute)}`}>
      <Stepper
        value={hour}
        min={0}
        max={23}
        label={label}
        format={pad}
        onChange={(h) => onChange(h * 60 + minute)}
        decreaseLabel={t('common.earlier')}
        increaseLabel={t('common.later')}
      />
      <Text style={[type.bodyLarge, { color: colors.text }]}>:</Text>
      <Stepper
        value={minute}
        min={0}
        max={45}
        step={15}
        label={label}
        format={pad}
        onChange={(m) => onChange(hour * 60 + m)}
        decreaseLabel={t('common.earlier')}
        increaseLabel={t('common.later')}
      />
    </View>
  );
}

/** A full-width choice card (radio): activity, climate, cups, reminder frequency. */
export function OptionCard({
  label,
  detail,
  badge,
  selected,
  onPress,
  icon,
}: {
  label: string;
  detail?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}) {
  const { colors, radius, spacing, type, touchTarget } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={[
        styles.card,
        {
          minHeight: touchTarget + 8,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: spacing.md,
          backgroundColor: selected ? colors.primary + '1A' : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon as never} size={26} color={selected ? colors.primary : colors.textMuted} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{label}</Text>
        {detail ? <Text style={[type.caption, { color: colors.textMuted }]}>{detail}</Text> : null}
      </View>
      {badge ? (
        <Text style={[type.caption, { color: colors.onPrimary, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden', fontWeight: '700' }]}>
          {badge}
        </Text>
      ) : null}
      {selected ? <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} /> : null}
    </Pressable>
  );
}
