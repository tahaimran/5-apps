import { Fragment, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Flame from 'lucide-react-native/icons/flame';
import Trash from 'lucide-react-native/icons/trash';
import Trophy from 'lucide-react-native/icons/trophy';
import { NativeAdCard, showInterstitial } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useTimeFormat } from '@shared/time';
import { Card, IconButton, PressableScale } from '@shared/ui';
import { BarChart } from '@/components/BarChart';
import { addDays, monthKeyOf, parseDayKey, weekdayOf } from '@/domain/dayKey';
import { monthDays, rangeStats, shiftMonth, weekDays, type ChartDay } from '@/domain/summaries';
import type { DayKey } from '@/domain/types';
import { recordInterstitialShown } from '@/ads/guard';
import { liveProgress } from '@/domain/streak';
import { DayStrip } from '@/features/history/DayStrip';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useDayLogs, useWater } from '@/store/water';
import { extraColorsFor } from '@/theme/tokens';
import { dayLabel, longDayLabel, spokenVolume, volume } from '@/ui/format';
import { beverageIcons } from '@/ui/icons';
import { IconCircle, StatTile } from '@/ui/SettingsRow';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/controls';

type Mode = 'day' | 'week' | 'month';
/** Plan §5.2: leaving History after this long on the charts is an interstitial candidate. */
export const INTERSTITIAL_VIEW_MS = 20_000;
const NATIVE_AFTER_ROWS = 3;

/** Monday … Sunday of the week holding `day`. */
const weekOf = (day: DayKey): DayKey[] => {
  const monday = addDays(day, -((weekdayOf(day) + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

function Pager({ label, onPrev, onNext, nextDisabled, prevLabel, nextLabel }: { label: string; onPrev: () => void; onNext: () => void; nextDisabled: boolean; prevLabel: string; nextLabel: string }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.pager}>
      <IconButton icon={ChevronLeft} label={prevLabel} onPress={onPrev} variant="tonal" />
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[type.bodyLarge, styles.pagerLabel, { color: colors.text }]}>
        {label}
      </Text>
      <IconButton icon={ChevronRight} label={nextLabel} onPress={onNext} variant="tonal" disabled={nextDisabled} />
    </View>
  );
}

/** Seven circles, filled with a check on goal days (the "weekly completion" row from the references). */
function GoalWeek({ days, today }: { days: ChartDay[]; today: DayKey }) {
  const { colors, type, mode } = useTheme();
  const extra = extraColorsFor(mode);
  const initials = t('history.weekdayInitials').split(',');
  return (
    <View style={styles.goalWeek} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {days.map((d) => (
        <View key={d.dayKey} style={styles.goalDay}>
          <View
            style={[
              styles.goalDot,
              {
                backgroundColor: d.reached ? extra.leaf : colors.surfaceAlt,
                borderColor: d.dayKey === today ? colors.primary : 'transparent',
              },
            ]}
          >
            {d.reached ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{initials[parseDayKey(d.dayKey).getDay()]}</Text>
        </View>
      ))}
    </View>
  );
}

export default function History() {
  const { colors, spacing, radius, type, touchTarget, shadow, fonts } = useTheme();
  const clock = useTimeFormat();
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
  const strip = weekOf(day);

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

  const rangeLabel = () => t('history.weekRange', { from: dayLabel(parseDayKey(week[0].dayKey)), to: dayLabel(parseDayKey(week[6].dayKey)) });

  const chartStats = (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <StatTile icon={ChartColumn} label={t('history.average')} value={volume(stats.averageMl, unit)} />
      <StatTile icon={Trophy} label={t('history.best')} value={stats.best ? volume(stats.best.effectiveMl, unit) : t('history.noBest')} />
      <StatTile icon={CalendarCheck} label={t('history.goalDays')} value={t('history.goalDaysValue', { reached: stats.reachedDays, elapsed: stats.elapsedDays })} />
    </View>
  );

  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>
        {t('tabs.history')}
      </Text>
      <View style={[styles.row, { gap: spacing.md }]}>
        <StatTile icon={Flame} label={t('history.streak')} value={t('history.streakValue', { count: live.streak })} />
        <StatTile icon={Trophy} label={t('history.bestStreak')} value={t('history.streakValue', { count: live.bestStreak })} />
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
          <View style={[{ backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: spacing.md, gap: spacing.md }]}>
            <Pager
              label={dayTitle}
              prevLabel={t('history.previousDay')}
              nextLabel={t('history.nextDay')}
              nextDisabled={day >= today}
              onPrev={() => setDay(addDays(day, -1))}
              onNext={() => setDay(addDays(day, 1))}
            />
            <DayStrip days={strip} today={today} selected={day} summaries={summaries} goalMl={goal.goalMl} unit={unit} onSelect={setDay} />
            <Text style={[type.title, { color: colors.text, fontWeight: '800', textAlign: 'center', fontFamily: fonts.display }]}>
              {t('history.dayTotal', { amount: volume(total, unit), goal: volume(summary?.goalMl ?? goal.goalMl, unit) })}
            </Text>
          </View>
          {logs.length === 0 ? (
            <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }]}>
              {t(day > today ? 'history.emptyFuture' : 'history.empty')}
            </Text>
          ) : (
            <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }, shadow(1)]}>
              {logs.map((l, i) => {
                const time = clock.at(new Date(l.ts));
                return (
                  <Fragment key={l.id}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: spacing.lg + 36 + spacing.md }]} />}
                    <View style={styles.entry}>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel={t('history.editEntry', { time, beverage: t(`beverages.${l.beverage}`), amount: spokenVolume(l.volumeMl, unit) })}
                        onPress={() => router.push({ pathname: '/edit-entry/[id]', params: { id: l.id } })}
                        scaleTo={0.98}
                        style={[styles.entryMain, { minHeight: touchTarget + 16, paddingLeft: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }]}
                      >
                        <IconCircle icon={beverageIcons[l.beverage]} />
                        <View style={styles.flex}>
                          <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700', fontFamily: fonts.display }]}>{time}</Text>
                          <Text style={[type.caption, { color: colors.textMuted }]}>
                            {t(`beverages.${l.beverage}`)}
                            {l.effectiveMl !== l.volumeMl ? ` · ${t('history.counted', { amount: volume(l.effectiveMl, unit) })}` : ''}
                          </Text>
                        </View>
                        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{volume(l.volumeMl, unit)}</Text>
                      </PressableScale>
                      <IconButton icon={Trash} color={colors.danger} label={t('history.deleteEntry', { time })} onPress={() => confirmDelete(l.id, l.volumeMl)} style={{ marginRight: spacing.xs }} />
                    </View>
                    {i === NATIVE_AFTER_ROWS - 1 && (
                      <View style={{ padding: spacing.md }}>
                        <NativeAdCard placement="history_list" />
                      </View>
                    )}
                  </Fragment>
                );
              })}
            </View>
          )}
          {logs.length > 0 && logs.length < NATIVE_AFTER_ROWS && <NativeAdCard placement="history_list" />}
        </View>
      )}

      {mode === 'week' && (
        <View style={{ gap: spacing.md }}>
          <Card style={{ gap: spacing.lg }}>
            <Pager
              label={rangeLabel()}
              prevLabel={t('history.previousWeek')}
              nextLabel={t('history.nextWeek')}
              nextDisabled={weekEnd >= today}
              onPrev={() => setWeekEnd(addDays(weekEnd, -7))}
              onNext={() => setWeekEnd(addDays(weekEnd, 7) > today ? today : addDays(weekEnd, 7))}
            />
            <GoalWeek days={week} today={today} />
            <BarChart days={week} goalMl={goal.goalMl} unit={unit} variant="week" today={today} />
          </Card>
          {chartStats}
          {stats.best && <NativeAdCard placement="history_list" />}
        </View>
      )}

      {mode === 'month' && (
        <View style={{ gap: spacing.md }}>
          <Card style={{ gap: spacing.lg }}>
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
              today={today}
              summary={t('history.chartMonth', {
                month: monthName,
                average: spokenVolume(stats.averageMl, unit),
                best: stats.best ? `${longDayLabel(parseDayKey(stats.best.dayKey))}, ${spokenVolume(stats.best.effectiveMl, unit)}` : t('history.noBest'),
                reached: stats.reachedDays,
                elapsed: stats.elapsedDays,
              })}
            />
          </Card>
          {chartStats}
          {stats.best && <NativeAdCard placement="history_list" />}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  pager: { flexDirection: 'row', alignItems: 'center' },
  pagerLabel: { flex: 1, textAlign: 'center', fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth },
  entry: { flexDirection: 'row', alignItems: 'center' },
  entryMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  goalWeek: { flexDirection: 'row', justifyContent: 'space-between' },
  goalDay: { alignItems: 'center', gap: 4 },
  goalDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
