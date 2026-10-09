import { View } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { t } from '@shared/i18n';
import { useAdScreen } from '@/ads/guard';
import { offerWeekCloseInterstitial } from '@/ads/weekClose';
import { useTheme } from '@shared/theme';
import { lengthText, weekCard, weightText } from '@/domain/weeks';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';

/** Plan §5.4: one week: the size comparison, length and weight, three notes, a question for the provider and the disclaimer. */
export default function WeekArticle() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const { colors, spacing, radius, type } = useTheme();
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
      <Screen>
        <ScreenHeader title={t('week.title', { n: Number.isFinite(week) ? week : '' })} />
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('week.notFound')}</AppText>
      </Screen>
    );
  }
  const length = lengthText(card.lengthCm, units);
  return (
    <Screen footer={<BannerSlot placement="week_banner" />}>
      <ScreenHeader title={t('week.title', { n: card.week })} />
      {/* The picture is a large emoji or a dot: decoration only, so it is hidden from a screen reader. */}
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ alignSelf: 'center', width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: colors.text, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontSize: 64, color: colors.text }}>{card.emoji ?? '•'}</AppText>
      </View>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700', textAlign: 'center' }]}>{t('week.sizeIs', { size: card.size })}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.text, textAlign: 'center' }]}>
        {`${t('week.length', { length: t(card.measure === 'crown-rump' ? 'week.lengthCrown' : 'week.lengthHeel', { length }) })} · ${t('week.weight', { weight: weightText(card.weightG, units, t('week.under1g')) })}`}
      </AppText>
      <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('week.approx')}</AppText>

      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>{t('week.notes')}</AppText>
      <View style={{ gap: spacing.sm }}>
        {card.bullets.map((b) => (
          <AppText key={b} style={[type.bodyLarge, { color: colors.text }]}>{`•  ${b}`}</AppText>
        ))}
      </View>

      <View style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.xs }}>
        <AppText accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('week.ask')}</AppText>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{card.askProvider}</AppText>
      </View>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('week.disclaimer')}</AppText>
    </Screen>
  );
}
