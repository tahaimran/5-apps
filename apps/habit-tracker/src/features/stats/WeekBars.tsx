import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { EASE_OUT } from '@shared/ui';
import { parseDayKey } from '@/domain/dayKey';
import type { DayBar } from '@/domain/stats';
import type { DayKey } from '@/domain/types';

const BAR_AREA = 128;

function Bar({ ratio, color, index }: { ratio: number; color: string; index: number }) {
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? ratio : 0);
  useEffect(() => {
    // Grows from the baseline once, staggered left to right.
    grow.set(reduced ? ratio : withDelay(index * 45, withTiming(ratio, { duration: 520, easing: EASE_OUT })));
  }, [ratio, reduced, index, grow]);
  // Absolute and childless, so animating height re-lays out nothing else and keeps the round ends.
  const style = useAnimatedStyle(() => ({ height: Math.max(grow.get(), 0) * BAR_AREA }));
  return <Animated.View style={[styles.fill, { backgroundColor: color }, style]} />;
}

export function WeekBars({ bars, today }: { bars: DayBar[]; today: DayKey }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.row}>
      {bars.map((bar, i) => {
        const date = parseDayKey(bar.day);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
        // An empty day stays empty; any progress gets at least a visible stub.
        const ratio = bar.done === 0 ? 0 : Math.max(0.08, bar.ratio);
        const isToday = bar.day === today;
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
            <View style={[styles.track, { height: BAR_AREA, backgroundColor: colors.surfaceAlt }]}>
              <Bar ratio={ratio} index={i} color={bar.ratio === 1 ? colors.success : colors.primary} />
            </View>
            <Text style={[type.caption, { color: isToday ? colors.primary : colors.textMuted, fontWeight: isToday ? '800' : '500' }]}>
              {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, alignItems: 'center', gap: 8 },
  track: { width: '100%', maxWidth: 28, borderRadius: 14, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: 14 },
});
