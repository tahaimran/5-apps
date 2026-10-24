import { StyleSheet, Text, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { parseDayKey } from '@/domain/dayKey';
import type { ChartDay } from '@/domain/summaries';
import type { Unit } from '@/domain/types';
import { extraColorsFor } from '@/theme/tokens';
import { longDayLabel, spokenVolume, volume } from '@/ui/format';

const HEIGHT = 168;

export interface BarChartProps {
  days: ChartDay[];
  goalMl: number;
  unit: Unit;
  /** 'week': every bar is reachable by a screen reader; 'month': a summary label only (31 stops is too many). */
  variant: 'week' | 'month';
  /** Spoken summary for the month variant. */
  summary?: string;
  today?: string;
}

/**
 * Daily intake as rounded columns over faint full-height tracks, with the goal as a dashed line
 * (plan §5.2). Plain views, so no charting library. Days that reached the goal are leaf green and,
 * in the week view, carry a check, so the status is never color-only.
 */
export function BarChart({ days, goalMl, unit, variant, summary, today }: BarChartProps) {
  const { colors, spacing, type, mode } = useTheme();
  const extra = extraColorsFor(mode);
  const top = Math.max(goalMl * 1.15, ...days.map((d) => d.effectiveMl), 1);
  const goalAt = (goalMl / top) * HEIGHT;
  const month = variant === 'month';
  const initials = t('history.weekdayInitials').split(',');
  const gap = month ? 3 : spacing.sm;

  return (
    <View accessible={month} accessibilityLabel={month ? summary : undefined} importantForAccessibility={month ? 'yes' : 'auto'} style={{ gap: spacing.xs }}>
      <View style={{ height: HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap }} importantForAccessibility={month ? 'no-hide-descendants' : 'auto'}>
        {days.map((d) => {
          const h = d.future ? 0 : Math.max(d.effectiveMl > 0 ? 6 : 0, (d.effectiveMl / top) * HEIGHT);
          const date = parseDayKey(d.dayKey);
          const isToday = d.dayKey === today;
          const label = d.future
            ? t('history.chartDayFuture', { day: longDayLabel(date) })
            : t(d.reached ? 'history.chartDay' : 'history.chartDayBelow', { day: longDayLabel(date), amount: spokenVolume(d.effectiveMl, unit) });
          const fill = d.reached ? extra.leaf : isToday ? colors.primary : extra.ring;
          return (
            <View key={d.dayKey} accessible={!month} accessibilityLabel={month ? undefined : label} style={[styles.col, { height: HEIGHT }]}>
              <View style={[styles.track, { backgroundColor: colors.surfaceAlt, borderRadius: month ? 3 : 10 }]} />
              <View style={[styles.bar, { height: h, backgroundColor: fill, borderRadius: month ? 3 : 10, opacity: isToday || d.reached ? 1 : 0.85 }]}>
                {d.reached && !month && h > 22 ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
            </View>
          );
        })}
        <View pointerEvents="none" style={[styles.goal, { bottom: goalAt, borderColor: colors.textMuted }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </View>
      <View style={{ flexDirection: 'row', gap }} importantForAccessibility="no-hide-descendants">
        {days.map((d, i) => (
          <Text
            key={d.dayKey}
            style={[type.caption, { color: d.dayKey === today ? colors.primary : colors.textMuted, fontWeight: d.dayKey === today ? '800' : '600', flex: 1, textAlign: 'center' }]}
            numberOfLines={1}
          >
            {month ? (i % 5 === 0 ? Number(d.dayKey.slice(8)) : '') : initials[parseDayKey(d.dayKey).getDay()]}
          </Text>
        ))}
      </View>
      <Text style={[type.caption, { color: colors.textMuted, textAlign: 'right' }]} importantForAccessibility="no-hide-descendants">
        {t('history.goalLegend', { goal: volume(goalMl, unit) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  track: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  bar: { width: '100%', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  goal: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
});
