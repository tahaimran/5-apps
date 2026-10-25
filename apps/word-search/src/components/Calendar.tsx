import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { IconButton } from '@shared/ui';
import { daysInMonth, weekdayOf } from '@/domain/dateKey';
import type { DailyState, DateKey } from '@/domain/types';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { formatDay, formatMonth, weekdayNames } from '@/ui/format';

const DAY = 38;

/**
 * A month of the daily puzzle (plan §5.5) on a frosted card: finished days are filled with a check
 * mark; missed days are plain, with no red cross and no shaming; today has a ring. Day numbers sit in
 * fixed circles, so they keep their drawn size at any phone font scale (the label carries the full date).
 */
export function Calendar({ monthKey, daily, today, onPrev, onNext }: { monthKey: string; daily: DailyState; today: DateKey; onPrev: () => void; onNext: () => void }) {
  const { colors, spacing, radius, type, shadow, fonts } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  const { fontScale } = useWindowDimensions();
  const [year, month] = monthKey.split('-').map(Number);
  const blanks = weekdayOf(`${monthKey}-01`);
  const days = daysInMonth(year, month);
  const cells: (number | null)[] = [...Array(blanks).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const names = weekdayNames();
  const fixed = (size: number) => size / Math.max(1, fontScale);
  return (
    <View style={[{ backgroundColor: hc ? colors.background : colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs }, hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1)]}>
      <View style={[styles.head, { gap: spacing.sm }]}>
        <IconButton icon={ChevronLeft} label={t('daily.prevMonth')} onPress={onPrev} variant="tonal" />
        <AppText accessibilityRole="header" style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '800', textAlign: 'center', fontFamily: fonts.display }]}>
          {formatMonth(monthKey)}
        </AppText>
        <IconButton icon={ChevronRight} label={t('daily.nextMonth')} onPress={onNext} variant="tonal" />
      </View>
      <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {names.map((n) => (
          <View key={n} style={styles.cell}>
            <AppText style={{ fontSize: fixed(13), lineHeight: fixed(18), color: colors.textMuted, fontWeight: '700' }}>{n.slice(0, 2)}</AppText>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <View key={w} style={styles.row}>
          {cells.slice(w * 7, w * 7 + 7).map((day, i) => {
            if (day === null) return <View key={i} style={[styles.cell, { height: DAY + 6 }]} />;
            const key = `${monthKey}-${String(day).padStart(2, '0')}`;
            const done = !!daily.completed[key];
            const isToday = key === today;
            const future = key > today;
            return (
              <View key={i} accessible accessibilityLabel={t(done ? 'daily.dayDone' : 'daily.dayNotDone', { date: formatDay(key) })} style={[styles.cell, { height: DAY + 6, opacity: future ? 0.45 : 1 }]}>
                <View
                  style={[
                    styles.day,
                    {
                      backgroundColor: done ? app.doneSoft : 'transparent',
                      borderWidth: isToday ? 3 : done && hc ? 2 : 0,
                      borderColor: isToday ? colors.primary : colors.success,
                    },
                  ]}
                >
                  <AppText style={{ fontSize: fixed(15), lineHeight: fixed(20), color: colors.text, fontWeight: isToday || done ? '800' : '600' }}>{day}</AppText>
                  {/* The date stays readable; a small check badge says the day is done (never color alone). */}
                  {done && (
                    <View style={[styles.badge, { backgroundColor: colors.success, borderColor: colors.surface }]}>
                      <Check size={11} color={colors.surface} strokeWidth={4} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: DAY, height: DAY, borderRadius: DAY / 2, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
