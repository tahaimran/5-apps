import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@shared/theme';

/** A tappable settings row with an icon, a label, an optional value and a chevron. */
export function NavRow({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress: () => void }) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={[styles.row, { minHeight: touchTarget + 8, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, gap: spacing.md }]}
    >
      <MaterialCommunityIcons name={icon as never} size={24} color={colors.textMuted} />
      <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{label}</Text>
      {value ? <Text style={[type.body, { color: colors.textMuted }]}>{value}</Text> : null}
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

/** A label with a switch on the right. */
export function SwitchRow({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const { colors, type, touchTarget } = useTheme();
  return (
    <View>
      <View style={[styles.row, { minHeight: touchTarget }]}>
        <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{label}</Text>
        <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>
      {hint ? <Text style={[type.caption, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
