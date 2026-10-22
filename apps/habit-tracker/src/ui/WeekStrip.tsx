import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, ProgressRing } from '@shared/ui';
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

const RING = 38;

/** Mon–Sun with a small completion ring around each date; the selected day is a filled pill. */
export function WeekStrip({ days, today, selected, progress, onSelect }: WeekStripProps) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const scroll = useRef<ScrollView>(null);
  const cell = touchTarget + spacing.xs;
  return (
    // Each day keeps at least a 48dp touch target; on narrow phones the strip scrolls a little.
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.strip, { gap: spacing.xs }]}
      onContentSizeChange={() => scroll.current?.scrollTo({ x: Math.max(0, days.indexOf(selected) * cell - cell * 2), animated: false })}
    >
      {days.map((day) => {
        const date = parseDayKey(day);
        const isFuture = day > today;
        const isSelected = day === selected;
        const p = progress[day];
        const ratio = p && p.total > 0 ? p.done / p.total : 0;
        const full = ratio === 1;
        const longDate = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        const fg = isSelected ? colors.onPrimary : colors.text;
        return (
          <PressableScale
            key={day}
            disabled={isFuture}
            onPress={() => onSelect(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: isFuture }}
            accessibilityLabel={
              p && p.total > 0 ? t('today.a11y.day', { date: longDate, done: p.done, total: p.total }) : t('today.a11y.dayNone', { date: longDate })
            }
            scaleTo={0.92}
            style={[
              styles.day,
              {
                minHeight: touchTarget + 30,
                minWidth: touchTarget,
                borderRadius: radius.lg,
                backgroundColor: isSelected ? colors.primary : 'transparent',
                opacity: isFuture ? 0.45 : 1,
              },
            ]}
          >
            <Text style={[type.caption, { color: isSelected ? colors.onPrimary : colors.textMuted, fontWeight: '600' }]}>
              {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Text>
            <ProgressRing
              size={RING}
              strokeWidth={3}
              progress={ratio}
              color={isSelected ? colors.onPrimary : full ? colors.success : colors.primary}
              trackColor={isSelected ? colors.onPrimary + '40' : colors.surfaceAlt}
            >
              <Text style={[type.body, { color: fg, fontWeight: day === today || isSelected ? '700' : '500' }]}>{date.getDate()}</Text>
            </ProgressRing>
            <View style={[styles.dot, { backgroundColor: day === today && !isSelected ? colors.primary : 'transparent' }]} />
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 1 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
