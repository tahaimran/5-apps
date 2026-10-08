import { StyleSheet, Text, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { parseDayKey } from '@/domain/dayKey';
import type { DayBar } from '@/domain/stats';
import type { DayKey } from '@/domain/types';

const BAR_AREA = 88;

export function WeekBars({ bars, today }: { bars: DayBar[]; today: DayKey }) {
  const { colors, radius, type } = useTheme();
  return (
    <View style={styles.row}>
      {bars.map((bar) => {
        const date = parseDayKey(bar.day);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
        const height = bar.total === 0 ? 0 : Math.max(6, Math.round(BAR_AREA * bar.ratio));
        return (
          <View
            key={bar.day}
            style={styles.col}
            accessible
            accessibilityLabel={
              bar.isFuture || bar.total === 0
                ? t('stats.barNone', { day: dayName })
                : t('stats.bar', { day: dayName, done: bar.done, total: bar.total })
            }
          >
            <View style={[styles.track, { height: BAR_AREA, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm }]}>
              <View
                style={{
                  height,
                  borderRadius: radius.sm,
                  backgroundColor: bar.ratio === 1 ? colors.success : colors.primary,
                }}
              />
            </View>
            <Text style={[type.caption, { color: bar.day === today ? colors.text : colors.textMuted, fontWeight: bar.day === today ? '700' : '400' }]}>
              {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  track: { width: '100%', justifyContent: 'flex-end', overflow: 'hidden' },
});
