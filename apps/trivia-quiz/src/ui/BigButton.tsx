import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

export interface BigButtonProps {
  label: string;
  onPress: () => void;
  /** `primary` is the single obvious action; `secondary` is an outlined button. */
  variant?: 'primary' | 'secondary';
  /** 56dp tall instead of 48dp, for the one primary action of a screen. */
  tall?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function BigButton({ label, onPress, variant = 'primary', tall, disabled, accessibilityHint, style }: BigButtonProps) {
  const { colors, radius, type, touchTarget } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          minHeight: tall ? Math.max(touchTarget, 56) : touchTarget,
          borderRadius: radius.md + 2,
          backgroundColor: primary ? colors.primary : 'transparent',
          borderColor: colors.primary,
          borderWidth: primary ? 0 : 2,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <AppText style={[type.bodyLarge, { color: primary ? colors.onPrimary : colors.primary, fontWeight: '700' }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 } });
