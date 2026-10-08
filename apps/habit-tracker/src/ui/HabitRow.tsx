import { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type AccessibilityActionEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { isComplete } from '@/domain/completion';
import type { StreakResult } from '@/domain/streaks';
import type { Entry, Habit } from '@/domain/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface HabitRowProps {
  habit: Habit;
  entry: Entry | undefined;
  streak: StreakResult;
  /** Extra hint under the name, e.g. "2/3 this week". */
  hint?: string;
  onToggle: () => void;
  onAdjust: (delta: 1 | -1) => void;
}

const streakLabel = (s: StreakResult) =>
  s.current === 0
    ? t('today.a11y.noStreak')
    : t(s.unit === 'weeks' ? 'today.a11y.streakWeeks' : 'today.a11y.streakDays', { count: s.current });

function HabitRowBase({ habit, entry, streak, hint, onToggle, onAdjust }: HabitRowProps) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const complete = isComplete(habit, entry);
  const value = entry?.value ?? 0;
  const isCount = habit.type === 'count';

  const label = isCount
    ? t('today.a11y.count', {
        name: habit.name,
        value,
        target: habit.target,
        unit: habit.unit ?? '',
        streak: streakLabel(streak),
      })
    : t('today.a11y.boolean', {
        name: habit.name,
        state: t(complete ? 'today.a11y.done' : 'today.a11y.notDone'),
        streak: streakLabel(streak),
      });

  const onAction = (e: AccessibilityActionEvent) => {
    switch (e.nativeEvent.actionName) {
      case 'increment':
        return isCount ? onAdjust(1) : !complete && onToggle();
      case 'decrement':
        return isCount ? onAdjust(-1) : complete && onToggle();
      case 'activate':
        return isCount ? onAdjust(1) : onToggle();
    }
  };

  const button = {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityActions={[
        { name: 'increment', label: t(isCount ? 'today.increase' : 'today.check') },
        { name: 'decrement', label: t(isCount ? 'today.decrease' : 'today.uncheck') },
      ]}
      onAccessibilityAction={onAction}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: habit.color + '26', borderRadius: radius.md }]}>
        <MaterialCommunityIcons name={habit.icon as IconName} size={24} color={habit.color} />
      </View>

      <View style={styles.body}>
        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]} numberOfLines={2}>
          {habit.name}
        </Text>
        {(hint || isCount) && (
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {hint ?? t('today.countProgress', { value, target: habit.target, unit: habit.unit ?? '' })}
          </Text>
        )}
      </View>

      {streak.current > 0 && (
        <View style={styles.streak} importantForAccessibility="no-hide-descendants">
          <MaterialCommunityIcons name="fire" size={20} color={colors.accent} />
          <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>
            {streak.current}
            {streak.unit === 'weeks' ? t('today.weekShort') : ''}
          </Text>
        </View>
      )}

      {isCount ? (
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('today.decrease')}
            disabled={value <= 0}
            onPress={() => onAdjust(-1)}
            style={[button, { opacity: value <= 0 ? 0.3 : 1 }]}
          >
            <MaterialCommunityIcons name="minus" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('today.increase')}
            onPress={() => onAdjust(1)}
            style={[button, { backgroundColor: complete ? colors.success : habit.color }]}
          >
            <MaterialCommunityIcons name={complete ? 'check' : 'plus'} size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={t(complete ? 'today.uncheck' : 'today.check')}
          accessibilityState={{ checked: complete }}
          onPress={onToggle}
          style={[
            button,
            { borderWidth: 2, borderColor: complete ? colors.success : colors.border, backgroundColor: complete ? colors.success : 'transparent' },
          ]}
        >
          {complete && <MaterialCommunityIcons name="check" size={26} color="#FFFFFF" />}
        </Pressable>
      )}
    </View>
  );
}

export const HabitRow = memo(HabitRowBase);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  tile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
});
