import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBank } from '@/content/bank';
import { categoryInfo } from '@/domain/categories';
import { currentLevel, levelCount } from '@/domain/classic';
import { defaultClassic } from '@/domain/defaults';
import { levelProgress, titleFor } from '@/domain/scoring';
import { dailyCard, formatCountdown } from '@/features/home/status';
import { openRound } from '@/features/play/navigation';
import { startBlitz, startClassic } from '@/features/play/start';
import { useToday } from '@/store/today';
import { useClassic, useDaily, useProfile, useStats, useStreak } from '@/store/stores';
import { db } from '@/store/storage';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { BigButton } from '@/ui/BigButton';
import { formatLongDay } from '@/ui/format';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { StreakChip } from '@/ui/StreakChip';
import { Tile } from '@/ui/Tile';
import { useNow } from '@/ui/useNow';
import { extraColors } from '@/theme/tokens';

/** Plan §5 Home: level bar, Daily Challenge hero card, Continue Classic, mode grid, banner. */
export default function Home() {
  const { colors, spacing, radius, mode } = useTheme();
  const today = useToday((s) => s.today);
  const now = useNow();
  const daily = useDaily((s) => s.value);
  const streak = useStreak((s) => s.value);
  const profile = useProfile((s) => s.value);
  const classic = useClassic((s) => s.value);
  const blitzBest = useStats((s) => s.value.blitzBest);
  const [coachDone, setCoachDone] = db.useStored('coachDone', true);
  const card = dailyCard(daily, streak, today, new Date(now));
  const progress = levelProgress(profile.xp);
  const bank = getBank();

  const last = db.get('classic.last');
  const category = last?.category ?? profile.favoriteCategories[0] ?? 'general';
  const total = levelCount(bank, category);
  const level = Math.min(currentLevel(classic[category] ?? defaultClassic(), total), total);
  const countdown = formatCountdown(card.msToReset);
  const amber = extraColors[mode].streak;

  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="h1" accessibilityRole="header">{t('home.title')}</AppText>
        <StreakChip streak={card.streak} />
      </View>

      <View accessible accessibilityLabel={t('home.levelLabel', { level: progress.level, title: t(`titles.${titleFor(progress.level)}`), into: progress.into, need: progress.need })} style={{ gap: spacing.xs }}>
        <AppText variant="body" style={{ fontWeight: '700' }}>{t('home.level', { level: progress.level, title: t(`titles.${titleFor(progress.level)}`) })}</AppText>
        <ProgressBar fraction={progress.fraction} />
        <AppText variant="caption" style={{ color: colors.textMuted }}>{t('home.xp', { into: progress.into, need: progress.need })}</AppText>
      </View>

      {!coachDone && card.state === 'notPlayed' && (
        <View accessible accessibilityLiveRegion="polite" style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface }}>
          <AppText variant="body" style={{ fontWeight: '700' }}>{t('coach.title')}</AppText>
          <BigButton variant="secondary" label={t('coach.gotIt')} onPress={() => setCoachDone(true)} />
        </View>
      )}

      {card.atRisk && (
        <View accessible accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: amber, backgroundColor: colors.surface }}>
          <MaterialCommunityIcons name="fire-alert" size={26} color={amber} />
          <AppText variant="body" style={{ flex: 1, fontWeight: '700' }}>{t('home.atRisk', { count: card.streak })}</AppText>
        </View>
      )}

      <View style={{ gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: extraColors[mode].primaryContainer, borderWidth: 2, borderColor: colors.primary }}>
        <AppText variant="overline" style={{ color: colors.textMuted, fontWeight: '700' }}>{t('home.dailyOverline', { date: formatLongDay(today) }).toUpperCase()}</AppText>
        <AppText variant="h1" accessibilityRole="header">{t('home.dailyTitle')}</AppText>
        {card.state === 'notPlayed' ? (
          <>
            <AppText variant="body" style={{ color: colors.textMuted }}>{t('home.dailyMeta')}</AppText>
            <AppText variant="body">{card.firstDay || card.streak === 0 ? t('home.dailyStart') : t('home.dailyKeep', { count: card.streak })}</AppText>
            <BigButton tall label={t('home.dailyPlay')} onPress={() => router.push('/daily')} />
          </>
        ) : (
          <>
            <AppText variant="h2">{t('home.dailyScore', { score: card.score })}</AppText>
            <AppText variant="body" style={{ color: colors.textMuted }}>{t('home.dailyBack', { hours: countdown.hours, minutes: countdown.minutes })}</AppText>
            <BigButton variant="secondary" label={t('home.dailyResult')} onPress={() => router.push('/daily/result')} />
          </>
        )}
      </View>

      <View style={{ gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <AppText variant="overline" style={{ color: colors.textMuted, fontWeight: '700' }}>{t('home.continue').toUpperCase()}</AppText>
        <AppText variant="h2">{t('home.continueCard', { category: t(`categories.${category}`), level })}</AppText>
        <BigButton label={t('home.continuePlay')} onPress={() => openRound(startClassic(category, level))} />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Tile icon="map-marker-path" title={t('modes.classic')} accent={categoryInfo('general').strong} accessibilityLabel={t('modes.classic')} onPress={() => router.push('/classic')} />
        <Tile icon="shape-outline" title={t('modes.category')} accent={categoryInfo('science').strong} accessibilityLabel={t('modes.category')} onPress={() => router.push('/category')} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Tile
          icon="lightning-bolt"
          title={t('modes.blitz')}
          detail={blitzBest > 0 ? t('modes.blitzBest', { count: blitzBest }) : t('modes.blitzDetail')}
          accent={categoryInfo('sports').strong}
          accessibilityLabel={t('modes.blitz')}
          onPress={() => openRound(startBlitz())}
        />
        <Tile icon="chart-box-outline" title={t('tabs.stats')} accent={categoryInfo('music').strong} accessibilityLabel={t('tabs.stats')} onPress={() => router.push('/stats')} />
      </View>
    </Screen>
  );
}
