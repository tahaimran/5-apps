import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MessageCircleQuestion from 'lucide-react-native/icons/message-circle-question-mark';
import Ruler from 'lucide-react-native/icons/ruler';
import Weight from 'lucide-react-native/icons/weight';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { offerWeekCloseInterstitial } from '@/ads/weekClose';
import { lengthText, weekCard, weightText } from '@/domain/weeks';
import { useSettings } from '@/store/settings';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { Screen } from '@/ui/Screen';
import { IconCircle, StatTile } from '@/ui/SettingsRow';
import { SizeArt } from '@/features/pregnancy/SizeArt';
import { artSize } from '@/features/pregnancy/SizeExplorer';

/** Plan §5.4: one week: the size comparison, length and weight, three notes, a question for the provider and the disclaimer. */
export default function WeekArticle() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const { colors, spacing, radius, type, shadow } = useTheme();
  const app = useAppColors();
  const units = useSettings((s) => s.settings.units);
  useAdScreen('weekArticle');
  // Plan §12: closing the article (Back) after a read is the one place an interstitial can appear; the rules decide.
  useFocusEffect(
    useCallback(() => {
      const openedAt = Date.now();
      return () => {
        void offerWeekCloseInterstitial(Date.now() - openedAt);
      };
    }, []),
  );
  const week = Number(n);
  const card = Number.isInteger(week) ? weekCard(week) : null;
  if (!card) {
    return (
      <Screen stack title={t('week.title', { n: Number.isFinite(week) ? week : '' })}>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('week.notFound')}</AppText>
      </Screen>
    );
  }
  const length = lengthText(card.lengthCm, units);
  return (
    <Screen stack title={t('week.title', { n: card.week })} footer={<BannerSlot placement="week_banner" />}>
      <View style={[{ borderRadius: radius.xl }, shadow(2)]}>
        <View style={[styles.hero, { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md }]}>
          <LinearGradient colors={app.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {/* The drawing on a soft disc: decoration, the heading below says what it is. */}
          <View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.disc, { backgroundColor: app.heroTrack }]}>
            <SizeArt size={card.size} px={artSize(card.week)} />
          </View>
          <AppText accessibilityRole="header" style={[type.headline, { color: app.onHero, fontWeight: '800', textAlign: 'center' }]}>
            {t('week.sizeIs', { size: card.size })}
          </AppText>
        </View>
      </View>
      <View style={[styles.row, { gap: spacing.sm }]}>
        <StatTile icon={Ruler} label={t('week.lengthTitle')} value={t('week.length', { length: t(card.measure === 'crown-rump' ? 'week.lengthCrown' : 'week.lengthHeel', { length }) })} />
        <StatTile icon={Weight} label={t('week.weightTitle')} value={t('week.weight', { weight: weightText(card.weightG, units, t('week.under1g')) })} tint={colors.accent} bg={colors.surfaceAlt} />
      </View>
      <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('week.approx')}</AppText>

      <Card style={{ gap: spacing.md }}>
        <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t('week.notes')}</AppText>
        {card.bullets.map((b) => (
          <View key={b} style={[styles.bullet, { gap: spacing.md }]}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <AppText style={[type.bodyLarge, styles.flex, { color: colors.text }]}>{b}</AppText>
          </View>
        ))}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <View style={[styles.row, { gap: spacing.md, alignItems: 'center' }]}>
          <IconCircle icon={MessageCircleQuestion} tint={app.alertIcon} bg={app.alertBg} />
          <AppText accessibilityRole="header" style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '700' }]}>{t('week.ask')}</AppText>
        </View>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{card.askProvider}</AppText>
      </Card>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('week.disclaimer')}</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { overflow: 'hidden', alignItems: 'center' },
  disc: { width: 176, height: 176, borderRadius: 88, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  bullet: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 10 },
});
