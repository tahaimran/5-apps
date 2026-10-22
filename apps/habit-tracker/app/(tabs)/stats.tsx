import { useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Flame from 'lucide-react-native/icons/flame';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Trophy from 'lucide-react-native/icons/trophy';
import { NativeAdCard, showInterstitial } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card, ProgressRing, type IconComponent } from '@shared/ui';
import { habitCompletion, dayProgress } from '@/domain/percent';
import { summarize, totalAcross, weekBars, type HabitSummary } from '@/domain/stats';
import { WeekBars } from '@/features/stats/WeekBars';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { extraColorsFor } from '@/theme/tokens';
import { HabitIcon } from '@/ui/icons';
import { Screen } from '@/ui/Screen';

const pct = (v: number | null) => (v === null ? t('detail.noData') : `${Math.round(v * 100)}%`);

export default function Stats() {
  const { colors, spacing, radius, type, mode } = useTheme();
  const today = useToday((s) => s.today);
  const weekStartsOn = useSettings((s) => s.settings.weekStartsOn);
  const { habits, habitOrder, entries, freezes } = useHabits();

  // Natural break (plan §12): when leaving the Stats tab.
  useFocusEffect(
    useCallback(
      () => () => {
        showInterstitial('leave_stats').catch(() => undefined);
      },
      [],
    ),
  );

  const list = useMemo(() => habitOrder.map((id) => habits[id]).filter((h) => h && !h.archivedAt), [habits, habitOrder]);
  const summaries = useMemo(() => summarize(list, entries, today, weekStartsOn), [list, entries, today, weekStartsOn]);
  const bars = useMemo(() => weekBars(list, entries, today, weekStartsOn), [list, entries, today, weekStartsOn]);
  const total = totalAcross(summaries);
  const todayProgress = dayProgress(list, entries, today, weekStartsOn);
  const todayPct = todayProgress.total === 0 ? null : todayProgress.done / todayProgress.total;
  const top = summaries[0] && summaries[0].current > 0 ? summaries[0] : null;
  const weekDone = bars.reduce((n, b) => n + b.done, 0);

  const streakText = (s: HabitSummary) => t(s.unit === 'weeks' ? 'detail.weeks' : 'detail.days', { count: s.current });

  /** One cell of the insight grid: a tinted icon, a big number and what it counts. */
  const insight = (Icon: IconComponent, tint: string, value: string, label: string, extra?: ReactNode) => (
    <Card style={[styles.insight, { gap: spacing.md, padding: spacing.lg }]}>
      <View accessible accessibilityLabel={`${label}: ${value}`} style={{ gap: spacing.md }}>
        <View style={styles.insightTop}>
          <View style={[styles.iconTile, { backgroundColor: tint + '22', borderRadius: radius.md }]}>
            <Icon size={20} color={tint} strokeWidth={2.25} />
          </View>
          {extra}
        </View>
        <View>
          <Text style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{value}</Text>
          <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{label}</Text>
        </View>
      </View>
    </Card>
  );

  if (summaries.length === 0 || total === 0) {
    return (
      <Screen>
        <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{t('tabs.stats')}</Text>
        <Card style={[styles.empty, { gap: spacing.md, padding: spacing.xl }]}>
          <View style={[styles.emptyArt, { backgroundColor: colors.primarySoft }]}>
            <ChartColumn size={34} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[type.bodyLarge, { color: colors.textMuted, textAlign: 'center' }]}>{t('stats.empty')}</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{t('tabs.stats')}</Text>

      <Card style={{ gap: spacing.lg }}>
        <View style={styles.cardHead}>
          <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', flex: 1 }]}>{t('stats.overview')}</Text>
          <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{t('stats.weekDone', { count: weekDone })}</Text>
        </View>
        <WeekBars bars={bars} today={today} />
      </Card>

      <View style={styles.grid}>
        {insight(
          CircleCheck,
          colors.success,
          pct(todayPct),
          t('stats.todayPct'),
          <ProgressRing size={36} strokeWidth={4} progress={todayPct ?? 0} color={colors.success} trackColor={colors.surfaceAlt} />,
        )}
        {insight(ChartColumn, colors.primary, String(total), t('stats.totalCheckIns'))}
      </View>
      <View style={styles.grid}>
        {insight(Flame, colors.accent, top ? String(top.current) : '0', t('stats.bestNow'))}
        {insight(Snowflake, extraColorsFor(mode).frozen, `${freezes.count}/2`, t('stats.freezes'))}
      </View>

      {top && (
        <Card style={[styles.cardHead, { gap: spacing.md }]}>
          <View style={[styles.iconTile, { backgroundColor: colors.accent + '22', borderRadius: radius.md }]}>
            <Trophy size={20} color={colors.accent} strokeWidth={2.25} />
          </View>
          <View
            style={styles.flex}
            accessible
            accessibilityLabel={`${t('stats.topHabit')}: ${habits[top.habit.id]?.name ?? ''}, ${streakText(top)}`}
          >
            <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{t('stats.topHabit')}</Text>
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
              {habits[top.habit.id]?.name}
            </Text>
          </View>
          <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{streakText(top)}</Text>
        </Card>
      )}

      <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>
        {t('stats.habits')}
      </Text>

      {summaries.map((s, i) => {
        const habit = habits[s.habit.id];
        const e = entries[habit.id] ?? {};
        const last7 = habitCompletion(habit, e, today, 7, weekStartsOn);
        const last30 = habitCompletion(habit, e, today, 30, weekStartsOn);
        const metric = (label: string, value: string) => (
          <View style={[styles.metric, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm }]}>
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{value}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
          </View>
        );
        return (
          <View key={habit.id} style={{ gap: spacing.md }}>
            <Card
              style={{ gap: spacing.md }}
              level={1}
            >
              <View
                style={{ gap: spacing.md }}
                accessible
                accessibilityLabel={`${habit.name}. ${t('stats.current')} ${streakText(s)}. ${t('stats.best')} ${t(s.unit === 'weeks' ? 'detail.weeks' : 'detail.days', { count: s.best })}. ${t('stats.last7')} ${pct(last7)}. ${t('stats.last30')} ${pct(last30)}. ${t('stats.checkIns')} ${s.total}`}
              >
                <View style={styles.cardHead}>
                  <View style={[styles.iconTile, { backgroundColor: habit.color + '1F', borderRadius: radius.md }]}>
                    <HabitIcon name={habit.icon} size={20} color={habit.color} />
                  </View>
                  <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]} numberOfLines={2}>{habit.name}</Text>
                  <View style={styles.streak}>
                    <Flame size={16} color={colors.accent} fill={colors.accent} strokeWidth={2} />
                    <Text style={[type.body, { color: colors.text, fontWeight: '800' }]}>{s.current}</Text>
                  </View>
                </View>
                <View style={styles.metrics}>
                  {metric(t('stats.best'), String(s.best))}
                  {metric(t('stats.last7'), pct(last7))}
                  {metric(t('stats.last30'), pct(last30))}
                  {metric(t('stats.checkIns'), String(s.total))}
                </View>
              </View>
            </Card>
            {i === 2 && summaries.length >= 3 && <NativeAdCard placement="stats_list" />}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  insight: { flex: 1 },
  insightTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconTile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, alignItems: 'center' },
  empty: { alignItems: 'center' },
  emptyArt: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
