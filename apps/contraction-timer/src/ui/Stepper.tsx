import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

/** A value with a minus and a plus button (no pickers: fewer libraries, and big targets). */
export function Stepper({
  label,
  value,
  minusLabel,
  plusLabel,
  onMinus,
  onPlus,
  stepText,
  minusDisabled,
  plusDisabled,
}: {
  label: string;
  value: string;
  minusLabel: string;
  plusLabel: string;
  onMinus: () => void;
  onPlus: () => void;
  /** What one tap changes ("1 min"), shown small between the buttons. */
  stepText?: string;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
}) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const button = (name: 'minus' | 'plus', text: string, onPress: () => void, disabled?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: touchTarget,
        height: touchTarget,
        borderRadius: touchTarget / 2,
        borderWidth: 2,
        borderColor: colors.text,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <MaterialCommunityIcons name={name} size={28} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={{ padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.xs }}>
      <AppText style={[type.body, { color: colors.textMuted }]}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        {button('minus', minusLabel, onMinus, minusDisabled)}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText style={[type.title, { color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{value}</AppText>
          {stepText ? <AppText style={[type.caption, { color: colors.textMuted }]}>{stepText}</AppText> : null}
        </View>
        {button('plus', plusLabel, onPlus, plusDisabled)}
      </View>
    </View>
  );
}
