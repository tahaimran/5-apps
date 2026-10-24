import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { AppText } from './AppText';

export interface TileProps {
  icon: IconComponent;
  title: string;
  detail?: string;
  /** The tile's hue: a white-text-safe shade (a category's `strong`), behind the white icon. */
  accent: string;
  selected?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  /** `radio` for a picker, `button` otherwise. */
  role?: 'button' | 'radio';
  /** Something under the text (a completion bar). */
  footer?: ReactNode;
}

/**
 * A card with a colored icon square, a title and a line (mode grid, category pickers). A picked tile
 * gets a primary border and a check badge, so the choice never relies on color alone.
 */
export function Tile({ icon: Icon, title, detail, accent, selected, accessibilityLabel, onPress, role = 'button', footer }: TileProps) {
  const { colors, radius, spacing, shadow } = useTheme();
  return (
    <PressableScale
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={role === 'radio' ? { selected: !!selected, checked: !!selected } : undefined}
      onPress={onPress}
      scaleTo={0.97}
      style={[
        styles.tile,
        { padding: spacing.md, gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderColor: selected ? colors.primary : 'transparent' },
        shadow(1),
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.square, { backgroundColor: accent }]}>
          <Icon size={22} color="#FFFFFF" strokeWidth={2.3} />
        </View>
        {selected ? (
          <View style={[styles.check, { backgroundColor: colors.primary }]}>
            <Check size={14} color={colors.onPrimary} strokeWidth={3.2} />
          </View>
        ) : null}
      </View>
      <View style={styles.text}>
        <AppText variant="body" style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        {detail ? (
          <AppText variant="caption" style={{ color: colors.textMuted }} numberOfLines={2}>
            {detail}
          </AppText>
        ) : null}
      </View>
      {footer}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 112, borderWidth: 2.5 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  square: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { gap: 2 },
  title: { fontWeight: '700' },
});
