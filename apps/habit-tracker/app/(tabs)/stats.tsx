import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeAdCard, showInterstitial } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { habitCompletion, dayProgress } from '@/domain/percent';
import { summarize, totalAcross, weekBars, type HabitSummary } from '@/domain/stats';
import { WeekBars } from '@/features/stats/WeekBars';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { Screen } from '@/ui/Screen';

const pct = (v: number | null) => (v === null ? t('detail.noData') : `${Math.round(v * 100)}%`);

export default function Stats() {
  const { colors, spacing, radius, type } = useTheme();
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

  const tile = (label: string, value: string) => (
    <View
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[type.title, { color: colors.text, fontWeight: '700' }]}>{value}</Text>
    </View>
  );

  const streakText = (s: HabitSummary) =>
    t(s.unit === 'weeks' ? 'detail.weeks' : 'detail.days', { count: s.current });

  if (summaries.length === 0 || total === 0) {
    return (
      <Screen>
        <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('tabs.stats')}</Text>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('stats.empty')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('tabs.stats')}</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md }]}>
        <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t('stats.overview')}</Text>
        <WeekBars bars={bars} today={today} />
        <View style={styles.tiles}>
          {tile(t('stats.todayPct'), pct(todayPct))}
          {tile(t('stats.totalCheckIns'), String(total))}
          {tile(t('stats.freezes'), `${freezes.count}/2`)}
        </View>
        {top && (
          <View style={styles.topRow} accessible accessibilityLabel={`${t('stats.topHabit')}: ${top.habit.id in habits ? habits[top.habit.id].name : ''}, ${streakText(top)}`}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.accent} />
            <Text style={[type.body, { color: colors.text }]}>
              {t('stats.topHabit')}: <Text style={{ fontWeight: '700' }}>{habits[top.habit.id]?.name}</Text> · {streakText(top)}
            </Text>
          </View>
        )}
      </View>

      <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '600', marginTop: spacing.sm }]}>
        {t('stats.habits')}
      </Text>

      {summaries.map((s, i) => {
        const habit = habits[s.habit.id];
        const e = entries[habit.id] ?? {};
        return (
          <View key={habit.id} style={{ gap: spacing.md }}>
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }]}
              accessible
              accessibilityLabel={`${habit.name}. ${t('stats.current')} ${streakText(s)}. ${t('stats.best')} ${t(s.unit === 'weeks' ? 'detail.weeks' : 'detail.days', { count: s.best })}. ${t('stats.last7')} ${pct(habitCompletion(habit, e, today, 7, weekStartsOn))}. ${t('stats.last30')} ${pct(habitCompletion(habit, e, today, 30, weekStartsOn))}. ${t('stats.checkIns')} ${s.total}`}
            >
              <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: habit.color }]} />
                <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600', flex: 1 }]} numberOfLines={2}>{habit.name}</Text>
                <MaterialCommunityIcons name="fire" size={18} color={colors.accent} />
                <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{s.current}</Text>
              </View>
              <View style={styles.tiles}>
                {tile(t('stats.best'), String(s.best))}
                {tile(t('stats.last7'), pct(habitCompletion(habit, e, today, 7, weekStartsOn)))}
                {tile(t('stats.last30'), pct(habitCompletion(habit, e, today, 30, weekStartsOn)))}
                {tile(t('stats.checkIns'), String(s.total))}
              </View>
            </View>
            {i === 2 && summaries.length >= 3 && <NativeAdCard placement="stats_list" />}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, borderWidth: StyleSheet.hairlineWidth },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
