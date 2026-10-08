import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { parseDayKey } from '@/domain/dayKey';
import type { DayProgress } from '@/domain/percent';
import type { DayKey } from '@/domain/types';

export interface WeekStripProps {
  days: DayKey[];
  today: DayKey;
  selected: DayKey;
  progress: Record<DayKey, DayProgress>;
  onSelect: (day: DayKey) => void;
}

export function WeekStrip({ days, today, selected, progress, onSelect }: WeekStripProps) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  return (
    <View style={[styles.strip, { gap: spacing.xs }]}>
      {days.map((day) => {
        const date = parseDayKey(day);
        const isFuture = day > today;
        const isSelected = day === selected;
        const p = progress[day];
        const full = !!p && p.total > 0 && p.done === p.total;
        const longDate = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        return (
          <Pressable
            key={day}
            disabled={isFuture}
            onPress={() => onSelect(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: isFuture }}
            accessibilityLabel={
              p && p.total > 0 ? t('today.a11y.day', { date: longDate, done: p.done, total: p.total }) : t('today.a11y.dayNone', { date: longDate })
            }
            style={[
              styles.day,
              {
                minHeight: touchTarget + 16,
                borderRadius: radius.md,
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: day === today ? colors.primary : colors.border,
                opacity: isFuture ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[type.caption, { color: isSelected ? colors.onPrimary : colors.textMuted }]}>
              {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Text>
            <Text style={[type.body, { color: isSelected ? colors.onPrimary : colors.text, fontWeight: '600' }]}>
              {date.getDate()}
            </Text>
            <View
              style={[
                styles.dot,
                { backgroundColor: full ? colors.success : p && p.done > 0 ? colors.accent : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row' },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
});
