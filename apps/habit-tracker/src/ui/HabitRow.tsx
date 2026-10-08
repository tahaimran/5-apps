import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type AccessibilityActionEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { isComplete } from '@/domain/completion';
import { elapsedSeconds, formatClock, isRunning } from '@/domain/timer';
import { readableOn } from '@/theme/contrast';
import { PopOnChange, StreakBadge } from './motion';
import type { StreakResult } from '@/domain/streaks';
import type { Entry, Habit } from '@/domain/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const TIMER_QUICK_ADD_MINUTES = 5;

export interface HabitRowProps {
  habit: Habit;
  entry: Entry | undefined;
  streak: StreakResult;
  /** Extra hint under the name, e.g. "2/3 this week". */
  hint?: string;
  onToggle: () => void;
  onAdjust: (delta: 1 | -1) => void;
  onTimerToggle: () => void;
  onAddMinutes: (minutes: number) => void;
  /** Tap the name area. */
  onOpen: () => void;
  /** Long press the name area (starts a drag). */
  onLongPress?: () => void;
  /** Accessible alternative to dragging. */
  onMove?: (delta: -1 | 1) => void;
}

const streakLabel = (s: StreakResult) =>
  s.current === 0
    ? t('today.a11y.noStreak')
    : t(s.unit === 'weeks' ? 'today.a11y.streakWeeks' : 'today.a11y.streakDays', { count: s.current });

/** Re-renders once a second while `active`. A timer shows time from a start timestamp, not a counter. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return active ? now : Date.now();
}

function HabitRowBase({
  habit,
  entry,
  streak,
  hint,
  onToggle,
  onAdjust,
  onTimerToggle,
  onAddMinutes,
  onOpen,
  onLongPress,
  onMove,
}: HabitRowProps) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const running = isRunning(entry);
  const now = useNow(running);
  const isCount = habit.type === 'count';
  const isTimer = habit.type === 'timer';
  const complete = isComplete(habit, entry, now);
  const value = entry?.value ?? 0;
  const seconds = elapsedSeconds(entry, now);
  const fill = complete ? colors.success : habit.color;
  const timerFill = complete && !running ? colors.success : habit.color;

  const detail = isCount
    ? t('today.countProgress', { value, target: habit.target, unit: habit.unit ?? '' })
    : isTimer
      ? t('timer.elapsed', { elapsed: formatClock(seconds), target: habit.target })
      : undefined;

  const label = isCount
    ? t('today.a11y.count', { name: habit.name, value, target: habit.target, unit: habit.unit ?? '', streak: streakLabel(streak) })
    : isTimer
      ? `${t('today.a11y.boolean', { name: habit.name, state: t(complete ? 'today.a11y.done' : 'today.a11y.notDone'), streak: streakLabel(streak) })}. ${t('timer.elapsed', { elapsed: formatClock(seconds), target: habit.target })}${running ? `, ${t('timer.running')}` : ''}`
      : t('today.a11y.boolean', { name: habit.name, state: t(complete ? 'today.a11y.done' : 'today.a11y.notDone'), streak: streakLabel(streak) });

  const onAction = (e: AccessibilityActionEvent) => {
    switch (e.nativeEvent.actionName) {
      case 'increment':
        return isCount ? onAdjust(1) : isTimer ? onAddMinutes(TIMER_QUICK_ADD_MINUTES) : !complete && onToggle();
      case 'decrement':
        return isCount ? onAdjust(-1) : isTimer ? onAddMinutes(-TIMER_QUICK_ADD_MINUTES) : complete && onToggle();
      case 'activate':
        return isCount ? onAdjust(1) : isTimer ? onTimerToggle() : onToggle();
      case 'details':
        return onOpen();
      case 'moveUp':
        return onMove?.(-1);
      case 'moveDown':
        return onMove?.(1);
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
        {
          name: 'increment',
          label: t(isCount ? 'today.increase' : isTimer ? 'timer.addLabel' : 'today.check', { minutes: TIMER_QUICK_ADD_MINUTES }),
        },
        {
          name: 'decrement',
          label: t(isCount ? 'today.decrease' : isTimer ? 'timer.addLabel' : 'today.uncheck', { minutes: -TIMER_QUICK_ADD_MINUTES }),
        },
        { name: 'details', label: t('today.details') },
        ...(onMove
          ? [
              { name: 'moveUp', label: t('today.moveUp') },
              { name: 'moveDown', label: t('today.moveDown') },
            ]
          : []),
      ]}
      onAccessibilityAction={onAction}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
      ]}
    >
      <Pressable
        onPress={onOpen}
        onLongPress={onLongPress}
        delayLongPress={250}
        style={[styles.main, { gap: spacing.md, minHeight: touchTarget }]}
        importantForAccessibility="no"
      >
        <View style={[styles.tile, { backgroundColor: habit.color + '26', borderRadius: radius.md }]}>
          <MaterialCommunityIcons name={habit.icon as IconName} size={24} color={habit.color} />
        </View>
        <View style={styles.body}>
          <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]} numberOfLines={2}>
            {habit.name}
          </Text>
          {(hint || detail) && (
            <Text style={[type.caption, { color: running ? colors.primary : colors.textMuted }]}>{hint ?? detail}</Text>
          )}
        </View>
      </Pressable>

      <StreakBadge streak={streak} />

      {isCount && (
        <View style={styles.controls}>
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
            style={[button, { backgroundColor: fill }]}
          >
            <MaterialCommunityIcons name={complete ? 'check' : 'plus'} size={22} color={readableOn(fill)} />
          </Pressable>
        </View>
      )}

      {isTimer && (
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('timer.addLabel', { minutes: TIMER_QUICK_ADD_MINUTES })}
            onPress={() => onAddMinutes(TIMER_QUICK_ADD_MINUTES)}
            style={[button, { width: touchTarget + 8 }]}
          >
            <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700' }]}>
              {t('timer.add', { minutes: TIMER_QUICK_ADD_MINUTES })}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(running ? 'timer.pause' : 'timer.start')}
            onPress={onTimerToggle}
            style={[button, { backgroundColor: timerFill }]}
          >
            <MaterialCommunityIcons name={running ? 'pause' : complete ? 'check' : 'play'} size={22} color={readableOn(timerFill)} />
          </Pressable>
        </View>
      )}

      {!isCount && !isTimer && (
        <PopOnChange active={complete}>
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
            {complete && <MaterialCommunityIcons name="check" size={26} color={readableOn(colors.success)} />}
          </Pressable>
        </PopOnChange>
      )}
    </View>
  );
}

export const HabitRow = memo(HabitRowBase);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  tile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  controls: { flexDirection: 'row', alignItems: 'center' },
});
