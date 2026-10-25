import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { PRIMARY_TARGET } from '@/theme/tokens';
import { AppText } from './AppText';

const LIP = 5;

export interface GameButtonProps {
  label: string;
  onPress: () => void;
  /**
   * `go`: the lime button for the one move that starts or continues play (Play, Continue, Next puzzle).
   * `plain`: a white button with a blue label for the second choice on a game screen.
   */
  variant?: 'go' | 'plain';
  icon?: IconComponent;
  /** Icon after the label (an arrow) instead of before it. */
  trailing?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The chunky game button of the reference screens: a rounded face on a darker lip, so it reads as
 * something to press, 64dp tall (plan §7.3: primary buttons). It dips on press (PressableScale). The
 * label wraps at large font sizes; it is never cut. High contrast: black with a yellow edge and label.
 */
export function GameButton({ label, onPress, variant = 'go', icon: Icon, trailing, disabled, accessibilityHint, accessibilityLabel, style }: GameButtonProps) {
  const { colors, radius, spacing, type, shadow, fonts } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  const go = variant === 'go';
  const fg = hc ? app.onGo : go ? app.onGo : colors.primary;
  const lip = hc ? app.goLip : go ? app.goLip : app.lip;
  const icon = Icon ? <Icon size={22} color={fg} strokeWidth={2.6} /> : null;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.97}
      style={[styles.outer, { borderRadius: radius.lg + 2, backgroundColor: lip, paddingBottom: hc ? 0 : LIP, opacity: disabled ? 0.45 : 1 }, !hc && shadow(2), style]}
    >
      <View style={[styles.face, { minHeight: PRIMARY_TARGET - (hc ? 0 : LIP), borderRadius: radius.lg, overflow: 'hidden', borderWidth: hc ? 3 : 0, borderColor: app.goLip }]}>
        {go && !hc ? (
          <LinearGradient colors={app.go} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: hc ? colors.background : colors.surface }]} />
        )}
        <View style={[styles.row, { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }]}>
          {!trailing && icon}
          <AppText style={[type.bodyLarge, styles.label, { color: fg, fontWeight: '800', fontFamily: fonts.display }]}>{label}</AppText>
          {trailing && icon}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  outer: { alignSelf: 'stretch' },
  face: { justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  label: { textAlign: 'center', flexShrink: 1 },
});
