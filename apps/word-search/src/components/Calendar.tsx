import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { daysInMonth, weekdayOf } from '@/domain/dateKey';
import type { DailyState, DateKey } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { formatDay, formatMonth, weekdayNames } from '@/ui/format';

/**
 * A month of the daily puzzle (plan §5.5): finished days carry a check mark; missed days are plain,
 * with no red cross and no shaming. Each day says "completed" or "not completed" to a screen reader.
 */
export function Calendar({ monthKey, daily, today }: { monthKey: string; daily: DailyState; today: DateKey }) {
  const { colors, spacing, radius, type } = useTheme();
  const [year, month] = monthKey.split('-').map(Number);
  const first = `${monthKey}-01`;
  const blanks = weekdayOf(first);
  const days = daysInMonth(year, month);
  const cells: (number | null)[] = [...Array(blanks).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const names = weekdayNames();
  return (
    <View accessible={false} style={{ gap: spacing.xs }}>
      <AppText accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700', textAlign: 'center' }]}>{formatMonth(monthKey)}</AppText>
      <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {names.map((n) => (
          <View key={n} style={{ flex: 1, alignItems: 'center' }}>
            <AppText style={[type.caption, { color: colors.textMuted, fontWeight: '700' }]}>{n.slice(0, 2)}</AppText>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <View key={w} style={{ flexDirection: 'row' }}>
          {cells.slice(w * 7, w * 7 + 7).map((day, i) => {
            if (day === null) return <View key={i} style={{ flex: 1, minHeight: 52 }} />;
            const key = `${monthKey}-${String(day).padStart(2, '0')}`;
            const done = !!daily.completed[key];
            const isToday = key === today;
            const future = key > today;
            return (
              <View
                key={i}
                accessible
                accessibilityLabel={t(done ? 'daily.dayDone' : 'daily.dayNotDone', { date: formatDay(key) })}
                style={{
                  flex: 1,
                  minHeight: 52,
                  margin: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.md,
                  borderWidth: isToday ? 3 : 1,
                  borderColor: isToday ? colors.primary : colors.border,
                  backgroundColor: done ? colors.surfaceAlt : colors.surface,
                  opacity: future ? 0.5 : 1,
                }}
              >
                <AppText style={[type.caption, { color: colors.text, fontWeight: '700' }]}>{day}</AppText>
                {done && <MaterialCommunityIcons name="check-bold" size={16} color={colors.success} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
