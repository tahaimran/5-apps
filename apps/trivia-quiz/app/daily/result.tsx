import { useRef } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { ShareCard } from '@/components/ShareCard';
import { lastSevenDays, playedToday } from '@/domain/daily';
import { effectiveStreak } from '@/domain/streak';
import { shareDaily, shareText } from '@/features/play/share';
import { useResult } from '@/store/result';
import { useToday } from '@/store/today';
import { useDaily, useStreak } from '@/store/stores';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { formatDay, weekdayNames } from '@/ui/format';
import { extraColors } from '@/theme/tokens';

/**
 * Plan §5 Daily result: score, the streak flame, the last 7 days, Share. It is built from the stored
 * Daily and streak, so it also works when opened again later (the "already played" state). No ad of any
 * kind is shown here (plan §12: the streak moment is protected).
 */
export default function DailyResult() {
  const { colors, spacing, radius, mode } = useTheme();
  const today = useToday((s) => s.today);
  const daily = useDaily((s) => s.value);
  const streakState = useStreak((s) => s.value);
  const last = useResult((s) => s.last);
  const cardRef = useRef<View>(null);
  if (!playedToday(daily, today)) return <Redirect href="/(tabs)" />;

  const streak = effectiveStreak(streakState, today);
  const justNow = last?.mode === 'daily' && last.date === today ? last : null;
  const week = lastSevenDays(daily, today);
  const names = weekdayNames();
  const flame = extraColors[mode].streak;
  const dateText = formatDay(today);
  const share = () => void shareDaily(() => captureRef(cardRef, { format: 'png', quality: 1 }), shareText(dateText, daily.lastScore, streak));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, alignItems: 'center' }}>
        <AppText variant="display" accessibilityRole="header" style={{ textAlign: 'center' }}>{justNow ? t('daily.done') : t('daily.alreadyPlayed')}</AppText>
        <View accessible accessibilityLabel={t('daily.scoreLabel', { score: daily.lastScore })}>
          <AppText variant="display" style={{ color: colors.primary }}>{`${daily.lastScore}/10`}</AppText>
        </View>
        {streak > 0 && (
          <View accessible accessibilityLabel={t('home.streakLabel', { count: streak })} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <MaterialCommunityIcons name="fire" size={44} color={flame} />
            <AppText variant="h1">{t('home.streak', { count: streak })}</AppText>
          </View>
        )}
        {justNow?.freezeUsed && <Banner text={t('daily.freezeUsed')} />}
        {justNow?.freezeEarned && <Banner text={t('daily.freezeEarned')} />}
        {justNow?.blockedByTimeZone && <Banner text={t('daily.timeZoneNote')} />}
        {justNow?.staleDaily && <Banner text={t('daily.staleNote')} />}
        {justNow && <AppText variant="body">{t('daily.xp', { xp: justNow.xp })}</AppText>}
        {streakState.freezes > 0 && <AppText variant="body" style={{ color: colors.textMuted }}>{t('daily.freezes', { count: streakState.freezes })}</AppText>}

        <View accessible accessibilityLabel={t('daily.weekLabel')} style={{ flexDirection: 'row', gap: spacing.sm, width: '100%', justifyContent: 'space-between' }}>
          {week.map((d) => {
            const dow = names[new Date(Number(d.date.slice(0, 4)), Number(d.date.slice(5, 7)) - 1, Number(d.date.slice(8, 10))).getDay()];
            const played = d.score !== null;
            return (
              <View key={d.date} accessible accessibilityLabel={played ? t('daily.dayPlayed', { day: dow, score: d.score ?? 0 }) : t('daily.dayMissed', { day: dow })} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: d.date === today ? 2 : 1, borderColor: d.date === today ? colors.primary : colors.border }}>
                <AppText variant="caption" style={{ color: colors.textMuted }}>{dow.slice(0, 2)}</AppText>
                <MaterialCommunityIcons name={played ? 'check-circle' : 'circle-outline'} size={22} color={played ? colors.success : colors.textMuted} />
                <AppText variant="caption" style={{ fontWeight: '700' }}>{played ? String(d.score) : '-'}</AppText>
              </View>
            );
          })}
        </View>

        <ShareCard ref={cardRef} date={dateText} score={daily.lastScore} streak={streak} />
        <View style={{ width: '100%', gap: spacing.md }}>
          <BigButton tall label={t('daily.share')} onPress={share} />
          <BigButton label={t('daily.playLevel')} onPress={() => router.replace('/classic')} />
          <BigButton variant="secondary" label={t('results.home')} onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Banner({ text }: { text: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View accessible accessibilityLiveRegion="polite" style={{ width: '100%', padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface }}>
      <AppText variant="body" style={{ fontWeight: '700', textAlign: 'center' }}>{text}</AppText>
    </View>
  );
}
