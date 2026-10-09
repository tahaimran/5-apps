import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@shared/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** A round icon-only button: always labelled (it is read out by TalkBack) and at least 56dp. */
export function IconButton({
  icon,
  label,
  onPress,
  selected,
  size = 28,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** For toggles (Night mode, Partner mode): drawn with a filled background and announced as selected. */
  selected?: boolean;
  size?: number;
}) {
  const { colors, touchTarget } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width: touchTarget,
        height: touchTarget,
        borderRadius: touchTarget / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? colors.text : colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
      })}
    >
      <MaterialCommunityIcons name={icon} size={size} color={colors.text} />
    </Pressable>
  );
}
