import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from './AppText';

export interface GoldButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  /** Icon after the label (an arrow) instead of before it. */
  trailing?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The quiz gold call to action: Next on the explanation, Play on the Daily hero. Used once per screen,
 * where it carries the main move; everywhere else the shared Button is the action.
 */
export function GoldButton({ label, onPress, icon: Icon, trailing, disabled, accessibilityHint, style }: GoldButtonProps) {
  const { radius, spacing, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  const icon = Icon ? <Icon size={20} color={x.onGold} strokeWidth={2.6} /> : null;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.96}
      style={[styles.pill, { borderRadius: radius.pill, gap: spacing.sm, backgroundColor: x.gold, opacity: disabled ? 0.5 : 1 }, shadow(2), style]}
    >
      {!trailing && icon}
      <AppText variant="body" style={[styles.label, { color: x.onGold }]}>
        {label}
      </AppText>
      {trailing && icon}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 56, paddingHorizontal: 24 },
  label: { fontWeight: '700', fontSize: 17 },
});
