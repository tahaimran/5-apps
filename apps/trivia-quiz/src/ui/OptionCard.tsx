import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

/**
 * A large radio card (56dp at least): a title, an optional line under it, and a filled or empty
 * circle plus a heavier border when selected, so the choice is never shown by color alone.
 */
export function OptionCard({ label, detail, selected, onPress, accessibilityHint }: { label: string; detail?: string; selected: boolean; onPress: () => void; accessibilityHint?: string }) {
  const { colors, radius, spacing, type } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <MaterialCommunityIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={28} color={selected ? colors.primary : colors.textMuted} />
      <View style={{ flex: 1 }}>
        <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{label}</AppText>
        {detail ? <AppText style={[type.body, { color: colors.textMuted }]}>{detail}</AppText> : null}
      </View>
    </Pressable>
  );
}
