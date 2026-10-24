import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { useTheme } from '@shared/theme';
import { Button, PressableScale, type IconComponent } from '@shared/ui';
import { HabitIcon } from './icons';

// The inset controls now live in the shared kit (Water uses them too).
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

export function PrimaryButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: IconComponent }) {
  return <Button label={label} onPress={onPress} disabled={disabled} icon={icon} />;
}

export function TextButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Button label={label} onPress={onPress} variant={danger ? 'danger' : 'ghost'} block={false} />;
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderWidth: 1, justifyContent: 'center' },
});
