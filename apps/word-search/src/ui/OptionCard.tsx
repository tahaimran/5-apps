import { StyleSheet, View } from 'react-native';
import Circle from 'lucide-react-native/icons/circle';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Square from 'lucide-react-native/icons/square';
import SquareCheck from 'lucide-react-native/icons/square-check';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { CSS_EASE_OUT, STATE_MS } from './motion';
import { AppText } from './AppText';

/**
 * A large choice card (72dp, plan §6): a title, an optional line under it, and a ticked circle (radio)
 * or square (checkbox) plus a teal edge and soft fill when selected, so the choice never rests on color
 * alone. The fill changes with a short CSS transition.
 */
export function OptionCard({
  label,
  detail,
  selected,
  onPress,
  accessibilityHint,
  kind = 'radio',
  icon: Icon,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  kind?: 'radio' | 'checkbox';
  /** A leading icon (onboarding answers). */
  icon?: IconComponent;
}) {
  const { colors, radius, spacing, type, shadow, mode } = useTheme();
  const reduced = useReducedMotion();
  const Mark = kind === 'checkbox' ? (selected ? SquareCheck : Square) : selected ? CircleCheck : Circle;
  return (
    <PressableScale
      accessibilityRole={kind}
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={kind === 'checkbox' ? { checked: selected } : { selected, checked: selected }}
      onPress={onPress}
      scaleTo={0.98}
      style={[{ borderRadius: radius.lg }, shadow(selected ? 0 : 1)]}
    >
      <Animated.View
        style={[
          styles.card,
          {
          gap: spacing.md,
          padding: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          // High contrast has no shadows, so an unselected card keeps a visible white edge.
          borderColor: selected ? colors.primary : mode === 'high-contrast' ? colors.border : colors.surface,
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          transitionProperty: ['backgroundColor', 'borderColor'],
          transitionDuration: reduced ? 0 : STATE_MS,
          transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      >
      {Icon ? <Icon size={24} color={selected ? colors.primary : colors.textMuted} strokeWidth={2.25} /> : null}
      <View style={styles.flex}>
        <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{label}</AppText>
        {detail ? <AppText style={[type.body, { color: colors.textMuted }]}>{detail}</AppText> : null}
      </View>
      <Mark size={26} color={selected ? colors.primary : colors.textMuted} strokeWidth={2.25} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderWidth: 2 },
});
