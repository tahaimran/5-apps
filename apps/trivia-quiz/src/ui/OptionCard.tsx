import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { AppText } from './AppText';
import { IconCircle } from './SettingsRow';

/**
 * A large radio card (64dp): an optional icon, a title, a line under it, and a radio dot that fills
 * plus a primary border when selected, so the choice is never shown by color alone.
 */
export function OptionCard({
  label,
  detail,
  selected,
  onPress,
  accessibilityHint,
  icon,
  tint,
  bg,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  icon?: IconComponent;
  tint?: string;
  bg?: string;
}) {
  const { colors, radius, spacing, shadow } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      scaleTo={0.98}
      style={[
        styles.card,
        { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderColor: selected ? colors.primary : 'transparent', backgroundColor: colors.surface },
        shadow(1),
      ]}
    >
      {icon ? <IconCircle icon={icon} tint={tint} bg={bg} size={44} /> : null}
      <View style={styles.flex}>
        <AppText variant="body" style={styles.title}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="caption" style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
            {detail}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.textMuted }]}>{selected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}</View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderWidth: 2.5 },
  flex: { flex: 1 },
  title: { fontWeight: '700', fontSize: 17 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
