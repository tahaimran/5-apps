import { StyleSheet, Text, View } from 'react-native';
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
}

/**
 * Daily intake as bars with the goal as a dashed line (plan §5.2). Built from plain views, so no
 * charting library is needed. Bars that reached the goal are drawn in the success color and
 * marked with a check, so the status is never color-only.
 */
export function BarChart({ days, goalMl, unit, variant, summary }: BarChartProps) {
  const { colors, spacing, radius, type, mode } = useTheme();
  const extra = extraColorsFor(mode);
  const top = Math.max(goalMl * 1.15, ...days.map((d) => d.effectiveMl), 1);
  const goalAt = (goalMl / top) * HEIGHT;
  const month = variant === 'month';
  const initials = t('history.weekdayInitials').split(',');

  return (
    <View
      accessible={month}
      accessibilityLabel={month ? summary : undefined}
      importantForAccessibility={month ? 'yes' : 'auto'}
      style={{ gap: spacing.xs }}
    >
      <View style={{ height: HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: month ? 2 : spacing.sm }} importantForAccessibility={month ? 'no-hide-descendants' : 'auto'}>
        {days.map((d) => {
          const h = d.future ? 0 : Math.max(d.effectiveMl > 0 ? 4 : 0, (d.effectiveMl / top) * HEIGHT);
          const date = parseDayKey(d.dayKey);
          const label = d.future
            ? t('history.chartDayFuture', { day: longDayLabel(date) })
            : t(d.reached ? 'history.chartDay' : 'history.chartDayBelow', { day: longDayLabel(date), amount: spokenVolume(d.effectiveMl, unit) });
          return (
            <View
              key={d.dayKey}
              accessible={!month}
              accessibilityLabel={month ? undefined : label}
              style={{ flex: 1, height: HEIGHT, justifyContent: 'flex-end', alignItems: 'center' }}
            >
              {d.reached && !month && <Text style={{ color: colors.success, fontSize: 12, fontWeight: '800' }}>✓</Text>}
              <View
                style={{
                  width: '100%',
                  height: h,
                  borderTopLeftRadius: radius.sm / 2,
                  borderTopRightRadius: radius.sm / 2,
                  backgroundColor: d.reached ? colors.success : extra.ring,
                }}
              />
            </View>
          );
        })}
        <View
          pointerEvents="none"
          style={[styles.goal, { bottom: goalAt, borderColor: colors.textMuted }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: month ? 2 : spacing.sm }} importantForAccessibility="no-hide-descendants">
        {days.map((d, i) => (
          <Text key={d.dayKey} style={[type.caption, { color: colors.textMuted, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
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
  goal: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
});
