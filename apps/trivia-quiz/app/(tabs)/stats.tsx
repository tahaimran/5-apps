import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { CATEGORIES } from '@/domain/categories';
import { levelProgress, titleFor } from '@/domain/scoring';
import { useDaily, useProfile, useStats, useStreak } from '@/store/stores';
import { useAdScreen } from '@/ads/guard';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';

const Stat = ({ label, value }: { label: string; value: string }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, minWidth: 140, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      <AppText variant="h1">{value}</AppText>
      <AppText variant="caption" style={{ color: colors.textMuted }}>{label}</AppText>
    </View>
  );
};

/** The Stats content (plan §5): totals, accuracy per category, best streak, Blitz best. Empty until a round is played. */
export function StatsContent() {
  const { colors, spacing } = useTheme();
  const stats = useStats((s) => s.value);
  const streak = useStreak((s) => s.value);
  const profile = useProfile((s) => s.value);
  const daily = useDaily((s) => s.value);
  const progress = levelProgress(profile.xp);
  if (stats.answered === 0 && daily.history.length === 0) {
    return <AppText accessibilityLiveRegion="polite" variant="body" style={{ color: colors.textMuted }}>{t('stats.empty')}</AppText>;
  }
  const accuracy = stats.answered === 0 ? 0 : Math.round((stats.correct / stats.answered) * 100);
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="body" style={{ fontWeight: '700' }}>{t('home.level', { level: progress.level, title: t(`titles.${titleFor(progress.level)}`) })}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <Stat label={t('stats.answered')} value={String(stats.answered)} />
        <Stat label={t('stats.accuracy')} value={`${accuracy}%`} />
        <Stat label={t('stats.bestStreak')} value={String(streak.best)} />
        <Stat label={t('stats.blitzBest')} value={String(stats.blitzBest)} />
        <Stat label={t('stats.rounds')} value={String(stats.roundsPlayed)} />
        <Stat label={t('stats.totalXp')} value={String(profile.xp)} />
      </View>
      <AppText variant="h2" accessibilityRole="header">{t('stats.byCategory')}</AppText>
      {CATEGORIES.map((c) => {
        const s = stats.byCategory[c.id] ?? { a: 0, c: 0 };
        const pct = s.a === 0 ? 0 : Math.round((s.c / s.a) * 100);
        const text = s.a === 0 ? t('stats.noAnswers') : t('stats.categoryLine', { percent: pct, answered: s.a });
        return (
          <View key={c.id} accessible accessibilityLabel={`${t(`categories.${c.id}`)}: ${text}`} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="body" style={{ fontWeight: '700' }}>{t(`categories.${c.id}`)}</AppText>
              <AppText variant="body" style={{ color: colors.textMuted }}>{text}</AppText>
            </View>
            <ProgressBar fraction={pct / 100} color={c.strong} />
          </View>
        );
      })}
    </View>
  );
}

export default function Stats() {
  useAdScreen('stats');
  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t('stats.title')}</AppText>
      <StatsContent />
    </Screen>
  );
}
