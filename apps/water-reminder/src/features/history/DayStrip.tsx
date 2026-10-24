import { StyleSheet, Text, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, ProgressRing } from '@shared/ui';
import { parseDayKey } from '@/domain/dayKey';
import type { DayKey, DaySummary, Unit } from '@/domain/types';
import { longDayLabel, spokenVolume } from '@/ui/format';

const RING = 36;

/**
 * Seven day pills (the date strip from the design references) with a small intake ring around each
 * date; the selected day is a filled pill and future days are disabled.
 */
export function DayStrip({
  days,
  today,
  selected,
  summaries,
  goalMl,
  unit,
  onSelect,
}: {
  days: DayKey[];
  today: DayKey;
  selected: DayKey;
  summaries: Record<DayKey, DaySummary>;
  goalMl: number;
  unit: Unit;
  onSelect: (day: DayKey) => void;
}) {
  const { colors, radius, type, touchTarget, mode } = useTheme();
  // Pills are raised parts: white on the soft card in light mode, lighter than the card in dark mode.
  const pill = mode === 'light' ? colors.surface : colors.surfaceAlt;
  const initials = t('history.weekdayInitials').split(',');
  return (
    <View style={styles.strip}>
      {days.map((day) => {
        const date = parseDayKey(day);
        const future = day > today;
        const isSelected = day === selected;
        const s = summaries[day];
        const ratio = s ? s.effectiveMl / Math.max(1, s.goalMl || goalMl) : 0;
        const fg = isSelected ? colors.onPrimary : colors.text;
        return (
          <PressableScale
            key={day}
            disabled={future}
            onPress={() => onSelect(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: future }}
            accessibilityLabel={future ? t('history.chartDayFuture', { day: longDayLabel(date) }) : t('history.stripDay', { day: longDayLabel(date), amount: spokenVolume(s?.effectiveMl ?? 0, unit) })}
            scaleTo={0.92}
            style={[
              styles.day,
              {
                minHeight: touchTarget + 30,
                minWidth: 40,
                borderRadius: radius.pill,
                backgroundColor: isSelected ? colors.primary : pill,
                opacity: future ? 0.45 : 1,
              },
            ]}
          >
            <Text style={[type.caption, { color: isSelected ? colors.onPrimary : colors.textMuted, fontWeight: '600' }]}>{initials[date.getDay()]}</Text>
            <ProgressRing
              size={RING}
              strokeWidth={3}
              progress={ratio}
              color={isSelected ? colors.onPrimary : s?.reached ? colors.success : colors.primary}
              trackColor={isSelected ? colors.onPrimary + '40' : mode === 'light' ? colors.surfaceAlt : colors.border}
            >
              <Text style={[type.body, { color: fg, fontWeight: day === today || isSelected ? '700' : '500' }]}>{date.getDate()}</Text>
            </ProgressRing>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
});
