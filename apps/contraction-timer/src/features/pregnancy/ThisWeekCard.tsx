import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import Baby from 'lucide-react-native/icons/baby';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import type { WeekCard } from '@/domain/weeks';
import { useAppColors, useStrongFill } from '@/theme/mode';
import { AppText } from '@/ui/AppText';

const ART = 132;

/** A soft womb of rings with the baby curled in the middle: the card's picture (decoration only). */
function Cradle() {
  const app = useAppColors();
  const c = ART / 2;
  return (
    <View style={{ width: ART, height: ART }} importantForAccessibility="no-hide-descendants">
      <Svg width={ART} height={ART}>
        <Circle cx={c} cy={c} r={c - 2} fill={app.heroTrack} fillOpacity={0.55} />
        <Circle cx={c} cy={c} r={c - 18} fill={app.heroTrack} fillOpacity={0.8} />
        <Circle cx={c} cy={c} r={c - 34} fill={app.heroTrack} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Baby size={44} color={app.heroRing} strokeWidth={2} />
      </View>
    </View>
  );
}

/**
 * This week's card (the reference's big picture card): the size comparison as the headline, length and
 * weight on frosted chips, and a round arrow that opens the week. The whole card is one button.
 */
export function ThisWeekCard({ card, length, weight }: { card: WeekCard; length: string; weight: string }) {
  const { spacing, radius, type, shadow } = useTheme();
  const app = useAppColors();
  const strong = useStrongFill();
  const headline = t('week.sizeIs', { size: card.size });
  const chips = [t('pregnancy.chipLength', { length }), t('pregnancy.chipWeight', { weight })];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('pregnancy.thisWeekLabel', { n: card.week, size: card.size, length, weight })}
      onPress={() => router.push({ pathname: '/pregnancy/week/[n]', params: { n: String(card.week) } })}
      scaleTo={0.98}
      style={[{ borderRadius: radius.xl }, shadow(2)]}
    >
      <View style={[styles.card, { borderRadius: radius.xl, padding: spacing.xl - 4, gap: spacing.md }]}>
        <LinearGradient colors={app.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.top, { gap: spacing.md }]}>
          <View style={[styles.flex, { gap: spacing.sm }]}>
            <View style={[styles.tag, { backgroundColor: app.heroTrack, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 }]}>
              <AppText style={[type.caption, { color: app.onHero, fontWeight: '700' }]}>{t('pregnancy.thisWeek', { n: card.week })}</AppText>
            </View>
            <AppText style={[type.title, { color: app.onHero, fontWeight: '800' }]}>{headline}</AppText>
          </View>
          <Cradle />
        </View>
        <View style={[styles.bottom, { gap: spacing.sm }]}>
          <View style={[styles.chips, { gap: spacing.sm }]}>
            {chips.map((c) => (
              <View key={c} style={{ backgroundColor: app.heroTrack, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 }}>
                <AppText style={[type.body, { color: app.onHero, fontWeight: '600' }]}>{c}</AppText>
              </View>
            ))}
          </View>
          <View style={[styles.arrow, { backgroundColor: strong.bg }]}>
            <ArrowUpRight size={24} color={strong.fg} strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 140 },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  tag: { alignSelf: 'flex-start' },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  arrow: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
