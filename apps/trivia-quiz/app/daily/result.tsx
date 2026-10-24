import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Check from 'lucide-react-native/icons/check';
import Flame from 'lucide-react-native/icons/flame';
import House from 'lucide-react-native/icons/house';
import Info from 'lucide-react-native/icons/info';
import Route from 'lucide-react-native/icons/route';
import Share2 from 'lucide-react-native/icons/share-2';
import Snowflake from 'lucide-react-native/icons/snowflake';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { ReminderSheet } from '@/components/ReminderSheet';
import { ShareCard } from '@/components/ShareCard';
import { lastSevenDays, playedToday } from '@/domain/daily';
import { shouldReask } from '@/domain/reminder';
import { effectiveStreak } from '@/domain/streak';
import { shareDaily, shareText } from '@/features/play/share';
import { ViewShot } from '@/native/optional';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useDaily, useStreak } from '@/store/stores';
import { useToday } from '@/store/today';
import { extraColorsFor, frost } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { formatDay, weekdayNames } from '@/ui/format';
import { GoldButton } from '@/ui/GoldButton';
import { BEAT, CSS_EASE_OUT } from '@/ui/motion';

/**
 * Plan §5 Daily result: score, the streak flame, the last 7 days, Share. It is built from the stored
 * Daily and streak, so it also works when opened again later (the "already played" state). No ad of any
 * kind is shown here (plan §12: the streak moment is protected).
 */
export default function DailyResult() {
  useAdScreen('dailyResult');
  const { colors, spacing, radius, mode, shadow, type } = useTheme();
  const x = extraColorsFor(mode);
  const reduced = useReducedMotion();
  const today = useToday((s) => s.today);
  const daily = useDaily((s) => s.value);
  const streakState = useStreak((s) => s.value);
  const last = useResult((s) => s.last);
  const cardRef = useRef<View>(null);
  const reminderOn = useSettings((s) => s.settings.reminder.enabled);
  const [askOpen, setAskOpen] = useState(false);
  const reached = last?.mode === 'daily' && last.streakCounted === true ? last.streak ?? 0 : 0;
  // Plan §6 O7: "Not now" is offered once more, after the first 3-day streak.
  useEffect(() => {
    const ask = db.get('reminderAsk') ?? { declinedAt: 0, reaskedAt: 0 };
    if (shouldReask({ reminderEnabled: reminderOn, declinedAt: ask.declinedAt, reaskedAt: ask.reaskedAt, streak: reached })) {
      db.set('reminderAsk', { ...ask, reaskedAt: Date.now() });
      setAskOpen(true);
    }
  }, [reached, reminderOn]);
  if (!playedToday(daily, today)) return <Redirect href="/(tabs)" />;

  const streak = effectiveStreak(streakState, today);
  const justNow = last?.mode === 'daily' && last.date === today ? last : null;
  const week = lastSevenDays(daily, today);
  const names = weekdayNames();
  const dateText = formatDay(today);
  // Builds without react-native-view-shot (the Habits preview client) share the text line instead.
  const capture = () => (ViewShot ? ViewShot.captureRef(cardRef, { format: 'png', quality: 1 }) : Promise.reject(new Error('no view-shot')));
  const share = () => void shareDaily(capture, shareText(dateText, daily.lastScore, streak));
  const notes = [
    justNow?.freezeUsed && { icon: Snowflake, text: t('daily.freezeUsed') },
    justNow?.freezeEarned && { icon: Snowflake, text: t('daily.freezeEarned') },
    justNow?.blockedByTimeZone && { icon: Info, text: t('daily.timeZoneNote') },
    justNow?.staleDaily && { icon: Info, text: t('daily.staleNote') },
  ].filter(Boolean) as { icon: typeof Info; text: string }[];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={[{ borderRadius: radius.xl }, shadow(3)]}>
          <View style={[styles.hero, { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm }]}>
            <LinearGradient colors={x.stage} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
            <AppText variant="h1" accessibilityRole="header" style={[styles.white, styles.center]}>
              {justNow ? t('daily.done') : t('daily.alreadyPlayed')}
            </AppText>
            <View accessible accessibilityLabel={t('daily.scoreLabel', { score: daily.lastScore })}>
              <AppText variant="display" style={[styles.white, styles.score, { fontSize: Math.round(type.display.fontSize * 1.6), lineHeight: Math.round(type.display.lineHeight * 1.55) }]}>{`${daily.lastScore}/10`}</AppText>
            </View>
            {streak > 0 && (
              <View accessible accessibilityLabel={t('home.streakLabel', { count: streak })} style={[styles.chip, { borderRadius: radius.pill, backgroundColor: frost }]}>
                {/* The flame beats once when today's day was just added (a one-shot keyframe). */}
                <Animated.View style={justNow?.streakCounted && !reduced ? { animationName: BEAT[0], animationDuration: '260ms', animationDelay: '200ms', animationTimingFunction: CSS_EASE_OUT } : null}>
                  <Flame size={30} color={x.gold} fill={x.gold} strokeWidth={2} />
                </Animated.View>
                <AppText variant="h2" style={styles.white}>
                  {t('home.streak', { count: streak })}
                </AppText>
              </View>
            )}
            {justNow && (
              <AppText variant="body" style={[styles.white, styles.bold]}>
                {t('daily.xp', { xp: justNow.xp })}
              </AppText>
            )}
          </View>
        </View>

        {notes.map((n) => (
          <View key={n.text} accessible accessibilityLiveRegion="polite" style={[styles.row, { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primarySoft }]}>
            <n.icon size={20} color={colors.primary} strokeWidth={2.3} />
            <AppText variant="body" style={[styles.flex, styles.semi]}>
              {n.text}
            </AppText>
          </View>
        ))}
        {streakState.freezes > 0 && (
          <AppText variant="body" style={{ color: colors.textMuted, textAlign: 'center' }}>
            {t('daily.freezes', { count: streakState.freezes })}
          </AppText>
        )}

        <Card style={{ gap: spacing.sm }}>
          <AppText variant="body" style={styles.bold}>
            {t('daily.weekLabel')}
          </AppText>
          <View accessible accessibilityLabel={t('daily.weekLabel')} style={[styles.row, { gap: spacing.xs, justifyContent: 'space-between' }]}>
            {week.map((d) => {
              const dow = names[new Date(Number(d.date.slice(0, 4)), Number(d.date.slice(5, 7)) - 1, Number(d.date.slice(8, 10))).getDay()];
              const played = d.score !== null;
              const isToday = d.date === today;
              return (
                <View
                  key={d.date}
                  accessible
                  accessibilityLabel={played ? t('daily.dayPlayed', { day: dow, score: d.score ?? 0 }) : t('daily.dayMissed', { day: dow })}
                  style={[styles.day, { gap: 4, borderRadius: radius.md, backgroundColor: isToday ? colors.primarySoft : 'transparent' }]}
                >
                  <AppText variant="caption" style={{ color: isToday ? colors.primary : colors.textMuted, fontWeight: '700' }}>
                    {dow.slice(0, 2)}
                  </AppText>
                  <View style={[styles.dot, { backgroundColor: played ? x.correct : 'transparent', borderColor: played ? x.correct : colors.border }]}>
                    {played ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                  <AppText variant="caption" style={styles.bold}>
                    {played ? String(d.score) : '-'}
                  </AppText>
                </View>
              );
            })}
          </View>
        </Card>

        <ShareCard ref={cardRef} date={dateText} score={daily.lastScore} streak={streak} />
        <View style={{ gap: spacing.sm }}>
          <GoldButton label={t('daily.share')} icon={Share2} onPress={share} />
          <Button variant="secondary" block icon={Route} label={t('daily.playLevel')} onPress={() => router.replace('/classic')} />
          <Button variant="ghost" icon={House} label={t('results.home')} onPress={() => router.dismissTo('/(tabs)')} />
        </View>
      </ScrollView>
      <ReminderSheet visible={askOpen} onClose={() => setAskOpen(false)} />
    </SafeAreaView>
  );
}

// White text on the violet stage is covered by the contrast test.
const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  hero: { overflow: 'hidden', alignItems: 'center' },
  white: { color: '#FFFFFF' },
  center: { textAlign: 'center' },
  bold: { fontWeight: '700' },
  semi: { fontWeight: '600' },
  score: { textAlign: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
