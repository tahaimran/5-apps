import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

export interface BigButtonProps {
  label: string;
  onPress: () => void;
  /** `primary` is the single obvious action; `secondary` is an outlined button. */
  variant?: 'primary' | 'secondary';
  /** 64dp tall instead of 56dp (plan §7.3: primary buttons). */
  tall?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  /** What a screen reader says when it must differ from the visible text (several "Add" buttons on one screen). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function BigButton({ label, onPress, variant = 'primary', tall, disabled, accessibilityHint, accessibilityLabel, style }: BigButtonProps) {
  const { colors, radius, type, touchTarget } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          minHeight: tall ? Math.max(touchTarget, 64) : touchTarget,
          borderRadius: radius.md + 2,
          backgroundColor: primary ? colors.primary : 'transparent',
          // The outline is the text color, not the fill: night's dark red fill alone would vanish on black.
          borderColor: colors.text,
          borderWidth: 2,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <AppText style={[type.bodyLarge, { color: primary ? colors.onPrimary : colors.text, fontWeight: '700' }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 } });
