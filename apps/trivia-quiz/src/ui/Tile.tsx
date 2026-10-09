import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

export interface TileProps {
  icon: string;
  title: string;
  detail?: string;
  accent: string;
  selected?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  /** `radio` for a picker, `button` otherwise. */
  role?: 'button' | 'radio';
}

/** A square-ish card with an icon, a title and an optional line (mode grid, category pickers). At least 48dp. */
export function Tile({ icon, title, detail, accent, selected, accessibilityLabel, onPress, role = 'button' }: TileProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={role === 'radio' ? { selected: !!selected, checked: !!selected } : undefined}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 96,
        padding: spacing.md,
        gap: spacing.xs,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: accent }}>
          <MaterialCommunityIcons name={icon as 'earth'} size={22} color="#FFFFFF" />
        </View>
        {selected ? <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} /> : null}
      </View>
      <AppText variant="body" style={{ fontWeight: '700' }}>{title}</AppText>
      {detail ? <AppText variant="caption" style={{ color: colors.textMuted }}>{detail}</AppText> : null}
    </Pressable>
  );
}
