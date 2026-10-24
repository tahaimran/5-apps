import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Flame from 'lucide-react-native/icons/flame';
import Play from 'lucide-react-native/icons/play';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Trophy from 'lucide-react-native/icons/trophy';
import X from 'lucide-react-native/icons/x';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, IconButton, PressableScale } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { getBank } from '@/content/bank';
import { categoryInfo } from '@/domain/categories';
import { currentLevel, levelCount } from '@/domain/classic';
import { defaultClassic } from '@/domain/defaults';
import { levelProgress, titleFor } from '@/domain/scoring';
import { canRestoreStreak, restoreStreak } from '@/domain/streak';
import { watchRewarded } from '@/features/ads/rewarded';
import { DailyHero } from '@/features/home/DailyHero';
import { dailyCard, formatCountdown } from '@/features/home/status';
import { openRound } from '@/features/play/navigation';
import { startBlitz, startClassic } from '@/features/play/start';
import { db } from '@/store/storage';
import { useClassic, useDaily, useProfile, useStats, useStreak } from '@/store/stores';
import { currentDateKey, useToday } from '@/store/today';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { categoryTone } from '@/ui/categoryTone';
import { formatLongDay } from '@/ui/format';
import { categoryIcons, modeIcons } from '@/ui/icons';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { IconCircle } from '@/ui/SettingsRow';
import { StreakChip } from '@/ui/StreakChip';
import { Tile } from '@/ui/Tile';
import { useNow } from '@/ui/useNow';

/** Plan §5 Home: level card, the Daily Challenge hero, Continue Classic, the mode grid, the banner. */
export default function Home() {
  useAdScreen('home');
  const { colors, spacing, radius, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  const today = useToday((s) => s.today);
  const now = useNow();
  const daily = useDaily((s) => s.value);
  const streak = useStreak((s) => s.value);
  const profile = useProfile((s) => s.value);
  const classic = useClassic((s) => s.value);
  const blitzBest = useStats((s) => s.value.blitzBest);
  const [coachDone, setCoachDone] = db.useStored('coachDone', true);
  const [restoreNote, setRestoreNote] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const card = dailyCard(daily, streak, today, new Date(now));
  const progress = levelProgress(profile.xp);
  const bank = getBank();

  const last = db.get('classic.last');
  const category = last?.category ?? profile.favoriteCategories[0] ?? 'general';
  const total = levelCount(bank, category);
  const level = Math.min(currentLevel(classic[category] ?? defaultClassic(), total), total);
  const countdown = formatCountdown(card.msToReset);
  const levelTitle = t(`titles.${titleFor(progress.level)}`);
  const tone = categoryTone(category, mode);
  const CategoryIcon = categoryIcons[category];

  const restore = async () => {
    setRestoring(true);
    setRestoreNote(null);
    const outcome = await watchRewarded('streak_restore');
    setRestoring(false);
    if (outcome === 'granted') {
      useStreak.getState().set(restoreStreak(useStreak.getState().value, currentDateKey()));
      setRestoreNote(t('ads.restoreDone'));
    } else if (outcome !== 'busy') setRestoreNote(t(outcome === 'unavailable' ? 'ads.unavailable' : 'ads.notEarned'));
  };

  return (
    <Screen title={t('home.title')} titleAccessory={<StreakChip streak={card.streak} />} footer={<BannerSlot placement="menu" />}>
      {/* Level progress (plan §5): the player's title and XP toward the next level. */}
      <Card style={{ gap: spacing.sm }}>
        <View accessible accessibilityLabel={t('home.levelLabel', { level: progress.level, title: levelTitle, into: progress.into, need: progress.need })} style={[styles.row, { gap: spacing.md }]}>
          <IconCircle icon={Trophy} tint={colors.accent} bg={x.goldSoft} size={44} />
          <View style={[styles.flex, { gap: 6 }]}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <AppText variant="body" style={styles.bold}>
                {t('home.level', { level: progress.level, title: levelTitle })}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textMuted, fontWeight: '700' }}>
                {t('home.xp', { into: progress.into, need: progress.need })}
              </AppText>
            </View>
            <ProgressBar fraction={progress.fraction} color={x.gold} />
          </View>
        </View>
      </Card>

      {!coachDone && card.state === 'notPlayed' && (
        <View accessible accessibilityLiveRegion="polite" style={[styles.row, styles.note, { gap: spacing.sm, padding: spacing.md, paddingRight: spacing.xs, borderRadius: radius.lg, backgroundColor: colors.primarySoft }]}>
          <Sparkles size={22} color={colors.primary} strokeWidth={2.3} />
          <AppText variant="body" style={[styles.flex, styles.bold]}>
            {t('coach.title')}
          </AppText>
          <IconButton icon={X} label={t('coach.gotIt')} onPress={() => setCoachDone(true)} color={colors.primary} />
        </View>
      )}

      {(canRestoreStreak(streak, today) || restoreNote !== null) && (
        <Card style={{ gap: spacing.sm }}>
          <View style={[styles.row, { gap: spacing.md }]}>
            <IconCircle icon={Flame} tint={x.streak} bg={x.streakSoft} size={44} />
            <AppText variant="h2" style={styles.flex}>
              {t('ads.restoreTitle')}
            </AppText>
          </View>
          <AppText variant="body">{t('ads.restoreBody', { count: streak.current })}</AppText>
          {restoreNote && (
            <AppText accessibilityLiveRegion="polite" variant="body" style={styles.bold}>
              {restoreNote}
            </AppText>
          )}
          <Button label={t('ads.restore')} icon={Play} loading={restoring} onPress={() => void restore()} />
        </Card>
      )}

      {card.atRisk && (
        <View accessible accessibilityLiveRegion="polite" style={[styles.row, styles.note, { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: x.streakSoft }]}>
          <Flame size={24} color={x.streak} fill={x.streak} strokeWidth={2} />
          <AppText variant="body" style={[styles.flex, styles.bold]}>
            {t('home.atRisk', { count: card.streak })}
          </AppText>
        </View>
      )}

      <DailyHero
        date={formatLongDay(today)}
        played={card.state !== 'notPlayed'}
        score={card.score}
        streak={card.streak}
        firstDay={card.firstDay}
        backIn={countdown}
        onPlay={() => router.push('/daily')}
        onResult={() => router.push('/daily/result')}
      />

      {/* Continue Classic: the next level in the last category played. */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${t('home.continue')}: ${t('home.continueCard', { category: t(`categories.${category}`), level })}. ${t('home.continuePlay')}`}
        onPress={() => openRound(startClassic(category, level))}
        scaleTo={0.98}
        style={[styles.row, { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface }, shadow(1)]}
      >
        <View style={[styles.square, { backgroundColor: tone.fill }]}>
          <CategoryIcon size={24} color="#FFFFFF" strokeWidth={2.3} />
        </View>
        <View style={styles.flex}>
          <AppText variant="overline" style={{ color: colors.textMuted }}>
            {t('home.continue').toUpperCase()}
          </AppText>
          <AppText variant="body" style={styles.bold}>
            {t('home.continueCard', { category: t(`categories.${category}`), level })}
          </AppText>
        </View>
        <View style={[styles.play, { backgroundColor: colors.primary }]}>
          <Play size={18} color={colors.onPrimary} fill={colors.onPrimary} strokeWidth={2} />
        </View>
      </PressableScale>

      <AppText variant="h2" accessibilityRole="header" style={{ marginTop: spacing.xs }}>
        {t('home.modes')}
      </AppText>
      <View style={[styles.row, { gap: spacing.md, alignItems: 'stretch' }]}>
        <Tile icon={modeIcons.classic} title={t('modes.classic')} detail={t('home.classicShort')} accent={categoryInfo('general').strong} accessibilityLabel={t('modes.classic')} onPress={() => router.push('/classic')} />
        <Tile icon={modeIcons.category} title={t('modes.category')} detail={t('home.categoryShort')} accent={categoryInfo('science').strong} accessibilityLabel={t('modes.category')} onPress={() => router.push('/category')} />
      </View>
      <View style={[styles.row, { gap: spacing.md, alignItems: 'stretch' }]}>
        <Tile
          icon={modeIcons.blitz}
          title={t('modes.blitz')}
          detail={blitzBest > 0 ? t('modes.blitzBest', { count: blitzBest }) : t('modes.blitzDetail')}
          accent={categoryInfo('sports').strong}
          accessibilityLabel={t('modes.blitz')}
          onPress={() => openRound(startBlitz())}
        />
        <Tile icon={modeIcons.stats} title={t('tabs.stats')} detail={t('home.statsShort')} accent={categoryInfo('music').strong} accessibilityLabel={t('tabs.stats')} onPress={() => router.push('/stats')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  note: {},
  bold: { fontWeight: '700' },
  square: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  play: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
