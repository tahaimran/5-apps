import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import { useTheme } from '@shared/theme';
import { TimeField } from '@shared/time';
import { Button, PressableScale, type IconComponent } from '@shared/ui';
import { formatClock, hhmmToMinute } from '@/domain/dayKey';

// The inset controls come from the shared kit (Habits uses the same ones).
export { Segmented, Stepper, Toggle } from '@shared/ui';

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
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export function TextField({ value, onChangeText, label, placeholder, maxLength, keyboardType, invalid, autoFocus, onSubmitEditing }: TextFieldProps) {
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
      autoFocus={autoFocus}
      selectTextOnFocus
      returnKeyType="done"
      onSubmitEditing={onSubmitEditing}
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
        },
      ]}
    />
  );
}

export function Chip({ label, selected, onPress, icon: Icon }: { label: string; selected: boolean; onPress: () => void; icon?: IconComponent }) {
  const { colors, radius, type, touchTarget } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
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
      {Icon ? <Icon size={18} color={fg} strokeWidth={2.25} /> : null}
      <Text style={[type.body, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </PressableScale>
  );
}

export function PrimaryButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: IconComponent }) {
  return <Button label={label} onPress={onPress} disabled={disabled} icon={icon} />;
}

export function TextButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Button label={label} onPress={onPress} variant={danger ? 'danger' : 'ghost'} block={false} />;
}

/** A time of day stored as minutes from midnight, picked on the shared wheel (12/24-hour aware). */
export function MinuteField({ value, onChange, label, minuteStep = 5 }: { value: number; onChange: (minute: number) => void; label: string; minuteStep?: number }) {
  return <TimeField value={formatClock(value)} onChange={(v) => onChange(hhmmToMinute(v))} label={label} minuteStep={minuteStep} />;
}

/** A full-width choice card (radio): activity, climate, cups, reminder frequency. */
export function OptionCard({
  label,
  detail,
  badge,
  selected,
  onPress,
  icon: Icon,
}: {
  label: string;
  detail?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconComponent;
}) {
  const { colors, radius, spacing, type, touchTarget } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      scaleTo={0.98}
      style={[
        styles.card,
        {
          minHeight: touchTarget + 12,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.md,
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      {Icon ? (
        <View style={[styles.iconTile, { backgroundColor: selected ? colors.surface : colors.surfaceAlt, borderRadius: radius.md }]}>
          <Icon size={22} color={colors.primary} strokeWidth={2.25} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{label}</Text>
        {detail ? <Text style={[type.caption, { color: colors.textMuted }]}>{detail}</Text> : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderRadius: radius.pill }]}>
          <Text style={[type.caption, { color: colors.onPrimary, fontWeight: '700' }]}>{badge}</Text>
        </View>
      ) : null}
      {selected ? <CircleCheck size={22} color={colors.primary} strokeWidth={2.25} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderWidth: 1, justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center' },
  iconTile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 3 },
});
