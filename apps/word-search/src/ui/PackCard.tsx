import { StyleSheet, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import type { WordPack } from '@/domain/packs';
import { PackTile } from '@/features/packs/PackArt';
import { useIsHighContrast } from '@/theme/mode';
import { AppText } from './AppText';
import { StarShape } from './StarRow';

/**
 * A pack on Home (plan §5.1): its picture on a tile, the name, the level the player is on and the stars
 * collected in it. At least 120dp tall; the name wraps rather than being cut.
 */
export function PackCard({ pack, level, stars, onPress }: { pack: WordPack; level: number; stars: number; onPress: () => void }) {
  const { colors, radius, spacing, type, shadow, fonts } = useTheme();
  const hc = useIsHighContrast();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={stars > 0 ? t('home.packLabelStars', { name: pack.name, level, count: stars }) : t('home.packLabel', { name: pack.name, level })}
      onPress={onPress}
      scaleTo={0.97}
      style={[
        styles.card,
        { minHeight: 120, padding: spacing.md, gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface },
        hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1),
      ]}
    >
      <PackTile packId={pack.id} px={84} />
      <AppText numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6} style={[type.bodyLarge, { color: colors.text, fontWeight: '800', fontFamily: fonts.display, textAlign: 'center' }]}>
        {pack.name}
      </AppText>
      <View style={[styles.meta, { gap: spacing.sm }]}>
        <AppText style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{t('packs.level', { level })}</AppText>
        {stars > 0 && (
          <View style={styles.stars}>
            <StarShape size={18} filled />
            <AppText style={[type.body, { color: colors.text, fontWeight: '700' }]}>{stars}</AppText>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '46%', flexGrow: 1, alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
