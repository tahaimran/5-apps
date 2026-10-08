import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { buildHeatmap, LEVEL_ALPHA, type HeatCell } from '@/domain/heatmap';
import type { Entries } from '@/domain/streaks';
import type { DayKey, Habit } from '@/domain/types';
import { extraColorsFor } from '@/theme/tokens';

const CELL = 16;
const GAP = 3;
const STEP = CELL + GAP;

const alphaHex = (a: number) =>
  Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');

export interface HeatmapProps {
  habit: Habit;
  entries: Entries;
  today: DayKey;
  weekStartsOn: 0 | 1;
  selected: DayKey | null;
  onSelect: (cell: HeatCell) => void;
}

/**
 * GitHub-style grid, newest week on the right, scrolled to today. It is built from plain
 * views with a single touch target (the tap position picks the cell), which keeps a full
 * year of cells smooth. A text list of recent days is the accessible alternative.
 */
export function Heatmap({ habit, entries, today, weekStartsOn, selected, onSelect }: HeatmapProps) {
  const { colors, radius, mode } = useTheme();
  const scroll = useRef<ScrollView>(null);
  const grid = useMemo(() => buildHeatmap(habit, entries, today, weekStartsOn), [habit, entries, today, weekStartsOn]);
  const frozenColor = extraColorsFor(mode).frozen;

  const colorFor = (cell: HeatCell): string => {
    switch (cell.state) {
      case 'before':
      case 'future':
        return 'transparent';
      case 'frozen':
        return frozenColor;
      case 'unscheduled':
        return colors.border + '55';
      case 'value':
        return cell.level === 0 ? colors.surfaceAlt : habit.color + alphaHex(LEVEL_ALPHA[cell.level]);
    }
  };

  const onPress = (e: GestureResponderEvent) => {
    const col = Math.floor(e.nativeEvent.locationX / STEP);
    const row = Math.floor(e.nativeEvent.locationY / STEP);
    const cell = grid[col]?.[row];
    if (cell && cell.state !== 'before' && cell.state !== 'future') onSelect(cell);
  };

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      accessible
      accessibilityLabel={t('heatmap.label', { weeks: grid.length })}
    >
      <Pressable onPress={onPress} accessible={false} importantForAccessibility="no-hide-descendants">
        <View style={styles.grid}>
          {grid.map((week, w) => (
            <View key={w} style={styles.week}>
              {week.map((cell) => (
                <View
                  key={cell.day}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: radius.sm / 2,
                    backgroundColor: colorFor(cell),
                    borderWidth: cell.day === selected ? 2 : 0,
                    borderColor: colors.text,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: GAP },
  week: { gap: GAP },
});
