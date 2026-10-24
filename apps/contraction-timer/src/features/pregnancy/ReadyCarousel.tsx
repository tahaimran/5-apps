import { ScrollView, StyleSheet, View } from 'react-native';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { AppText } from '@/ui/AppText';
import { IconCircle } from '@/ui/SettingsRow';

export interface ReadyItem {
  key: string;
  icon: IconComponent;
  title: string;
  detail: string;
  /** 0…1, or null for no bar. */
  progress: number | null;
  tint: string;
  bg: string;
  onPress: () => void;
}

const CARD = 176;

/**
 * "Getting ready" (the reference's row of cards): one card each for the hospital bag, the birth plan
 * and the due date, side by side and swiped sideways, each with how far along it is.
 */
export function ReadyCarousel({ items }: { items: ReadyItem[] }) {
  const { colors, spacing, radius, type, shadow } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl - 4, paddingVertical: spacing.sm }} style={styles.bleed}>
      {items.map((it) => (
        <PressableScale
          key={it.key}
          accessibilityRole="button"
          accessibilityLabel={`${it.title}, ${it.detail}`}
          onPress={it.onPress}
          scaleTo={0.97}
          style={[{ width: CARD, minHeight: 176, padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg + 4, backgroundColor: colors.surface }, shadow(1)]}
        >
          <View style={styles.head}>
            <IconCircle icon={it.icon} tint={it.tint} bg={it.bg} size={44} />
            <ArrowUpRight size={20} color={colors.textMuted} strokeWidth={2.25} />
          </View>
          <View style={[styles.flex, { gap: 2, justifyContent: 'flex-end' }]}>
            <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{it.title}</AppText>
            <AppText style={[type.body, { color: colors.textMuted }]}>{it.detail}</AppText>
          </View>
          {it.progress !== null ? (
            <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
              <View style={[styles.fill, { width: `${Math.round(Math.min(1, Math.max(0, it.progress)) * 100)}%`, backgroundColor: it.tint }]} />
            </View>
          ) : null}
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // The row runs to the screen edges (the list's 20dp gutter is undone), so cards slide off naturally.
  bleed: { marginHorizontal: -20 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
