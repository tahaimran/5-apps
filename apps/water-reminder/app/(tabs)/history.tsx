import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeAdCard, showInterstitial } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { BarChart } from '@/components/BarChart';
import { addDays, monthKeyOf, parseDayKey } from '@/domain/dayKey';
import { beverageIcons } from '@/domain/hydration';
import { monthDays, rangeStats, shiftMonth, weekDays } from '@/domain/summaries';
import type { DayKey } from '@/domain/types';
import { recordInterstitialShown } from '@/ads/guard';
import { liveProgress } from '@/domain/streak';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useDayLogs, useWater } from '@/store/water';
import { clockTime, dayLabel, longDayLabel, spokenVolume, volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/controls';

type Mode = 'day' | 'week' | 'month';
/** Plan §5.2: leaving History after this long on the charts is an interstitial candidate. */
export const INTERSTITIAL_VIEW_MS = 20_000;
const NATIVE_AFTER_ROWS = 3;

function Pager({ label, onPrev, onNext, nextDisabled, prevLabel, nextLabel }: { label: string; onPrev: () => void; onNext: () => void; nextDisabled: boolean; prevLabel: string; nextLabel: string }) {
  const { colors, type, touchTarget } = useTheme();
  const box = { minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={styles.pager}>
      <Pressable accessibilityRole="button" accessibilityLabel={prevLabel} onPress={onPrev} style={box}>
        <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
      </Pressable>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1, textAlign: 'center' }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        onPress={onNext}
        style={[box, { opacity: nextDisabled ? 0.3 : 1 }]}
      >
        <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
      </Pressable>
    </View>
  );
}

export default function History() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const feedback = useFeedback();
  const { goal } = useSettings();
  const today = useToday((s) => s.today);
  const summaries = useWater((s) => s.summaries);
  const progress = useWater((s) => s.progress);
  const unit = goal.unit;

  const [mode, setMode] = useState<Mode>('day');
  const [day, setDay] = useState<DayKey>(today);
  const [weekEnd, setWeekEnd] = useState<DayKey>(today);
  const [month, setMonth] = useState(monthKeyOf(today));
  const logs = useDayLogs(day);

  // Interstitial candidate: leaving the tab after at least 20 s on it.
  useFocusEffect(
    useCallback(() => {
      const since = Date.now();
      return () => {
        if (Date.now() - since < INTERSTITIAL_VIEW_MS) return;
        void showInterstitial('history_exit').then((shown) => shown && recordInterstitialShown());
      };
    }, []),
  );

  const live = liveProgress(progress, summaries[today]?.reached ?? false);
  const week = useMemo(() => weekDays(summaries, weekEnd, today, goal.goalMl), [summaries, weekEnd, today, goal.goalMl]);
  const monthly = useMemo(() => monthDays(summaries, month, today, goal.goalMl), [summaries, month, today, goal.goalMl]);
  const stats = rangeStats(mode === 'week' ? week : monthly);
  const monthDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dayTitle = day === today ? t('history.today') : day === addDays(today, -1) ? t('history.yesterday') : dayLabel(parseDayKey(day));
  const summary = summaries[day];
  const total = summary?.effectiveMl ?? 0;

  const confirmDelete = (id: string, ml: number) =>
    Alert.alert(t('history.deleteTitle'), t('history.deleteBody', { amount: volume(ml, unit) }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          feedback.warning();
          useWater.getState().deleteEntry(id);
        },
      },
    ]);

  const statBox = (label: string, value: string) => (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={[styles.stat, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md }]}>
      <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{label}</Text>
      <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '800' }]}>{value}</Text>
    </View>
  );

  const rangeLabel = () => {
    const first = parseDayKey(week[0].dayKey);
    const last = parseDayKey(week[6].dayKey);
    return t('history.weekRange', { from: dayLabel(first), to: dayLabel(last) });
  };

  const chartStats = (
    <View style={styles.stats}>
      {statBox(t('history.average'), volume(stats.averageMl, unit))}
      {statBox(t('history.best'), stats.best ? volume(stats.best.effectiveMl, unit) : t('history.noBest'))}
      {statBox(t('history.goalDays'), t('history.goalDaysValue', { reached: stats.reachedDays, elapsed: stats.elapsedDays }))}
    </View>
  );

  return (
    <Screen>
        <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>
          {t('tabs.history')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {statBox(t('history.streak'), t('history.streakValue', { count: live.streak }))}
          {statBox(t('history.bestStreak'), t('history.streakValue', { count: live.bestStreak }))}
        </View>
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'day', label: t('history.day') },
            { value: 'week', label: t('history.week') },
            { value: 'month', label: t('history.month') },
          ]}
        />

        {mode === 'day' && (
          <View style={{ gap: spacing.md }}>
            <Pager
              label={dayTitle}
              prevLabel={t('history.previousDay')}
              nextLabel={t('history.nextDay')}
              nextDisabled={day >= today}
              onPrev={() => setDay(addDays(day, -1))}
              onNext={() => setDay(addDays(day, 1))}
            />
            <Text style={[type.title, { color: colors.text, fontWeight: '800', textAlign: 'center' }]}>
              {t('history.dayTotal', { amount: volume(total, unit), goal: volume(summary?.goalMl ?? goal.goalMl, unit) })}
            </Text>
            {logs.length === 0 ? (
              <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }]}>
                {t(day > today ? 'history.emptyFuture' : 'history.empty')}
              </Text>
            ) : (
              logs.map((l, i) => {
                const time = clockTime(new Date(l.ts));
                return (
                  <View key={l.id} style={{ gap: spacing.md }}>
                    <View style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('history.editEntry', { time, beverage: t(`beverages.${l.beverage}`), amount: spokenVolume(l.volumeMl, unit) })}
                        onPress={() => router.push({ pathname: '/edit-entry/[id]', params: { id: l.id } })}
                        style={[styles.rowMain, { minHeight: touchTarget + 8, padding: spacing.md }]}
                      >
                        <MaterialCommunityIcons name={beverageIcons[l.beverage] as never} size={24} color={colors.primary} />
                        <Text style={[type.body, { color: colors.textMuted, width: 74 }]}>{time}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{volume(l.volumeMl, unit)}</Text>
                          {l.effectiveMl !== l.volumeMl && (
                            <Text style={[type.caption, { color: colors.textMuted }]}>{t('history.counted', { amount: volume(l.effectiveMl, unit) })}</Text>
                          )}
                        </View>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('history.deleteEntry', { time })}
                        onPress={() => confirmDelete(l.id, l.volumeMl)}
                        style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
                      </Pressable>
                    </View>
                    {i === NATIVE_AFTER_ROWS - 1 && <NativeAdCard placement="history_list" />}
                  </View>
                );
              })
            )}
            {logs.length > 0 && logs.length < NATIVE_AFTER_ROWS && <NativeAdCard placement="history_list" />}
          </View>
        )}

        {mode === 'week' && (
          <View style={{ gap: spacing.md }}>
            <Pager
              label={rangeLabel()}
              prevLabel={t('history.previousWeek')}
              nextLabel={t('history.nextWeek')}
              nextDisabled={weekEnd >= today}
              onPrev={() => setWeekEnd(addDays(weekEnd, -7))}
              onNext={() => setWeekEnd(addDays(weekEnd, 7) > today ? today : addDays(weekEnd, 7))}
            />
            <BarChart days={week} goalMl={goal.goalMl} unit={unit} variant="week" />
            {chartStats}
            {stats.best && <NativeAdCard placement="history_list" />}
          </View>
        )}

        {mode === 'month' && (
          <View style={{ gap: spacing.md }}>
            <Pager
              label={monthName}
              prevLabel={t('history.previousMonth')}
              nextLabel={t('history.nextMonth')}
              nextDisabled={month >= monthKeyOf(today)}
              onPrev={() => setMonth(shiftMonth(month, -1))}
              onNext={() => setMonth(shiftMonth(month, 1))}
            />
            <BarChart
              days={monthly}
              goalMl={goal.goalMl}
              unit={unit}
              variant="month"
              summary={t('history.chartMonth', {
                month: monthName,
                average: spokenVolume(stats.averageMl, unit),
                best: stats.best ? `${longDayLabel(parseDayKey(stats.best.dayKey))}, ${spokenVolume(stats.best.effectiveMl, unit)}` : t('history.noBest'),
                reached: stats.reachedDays,
                elapsed: stats.elapsedDays,
              })}
            />
            {chartStats}
            {stats.best && <NativeAdCard placement="history_list" />}
          </View>
        )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pager: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 2 },
});
