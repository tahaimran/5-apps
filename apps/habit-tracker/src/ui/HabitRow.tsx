import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type AccessibilityActionEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Check from 'lucide-react-native/icons/check';
import Minus from 'lucide-react-native/icons/minus';
import PencilLine from 'lucide-react-native/icons/pencil-line';
import Pause from 'lucide-react-native/icons/pause';
import Play from 'lucide-react-native/icons/play';
import Plus from 'lucide-react-native/icons/plus';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { EASE_OUT, PressableScale, ProgressRing } from '@shared/ui';
import { isComplete } from '@/domain/completion';
import { countStep, stepLabel } from '@/domain/countStep';
import { elapsedSeconds, formatClock, isRunning } from '@/domain/timer';
import { readableOn } from '@/theme/contrast';
import { CheckButton } from './CheckButton';
import { HabitIcon } from './icons';
import { StreakBadge } from './motion';
import type { StreakResult } from '@/domain/streaks';
import type { Entry, Habit } from '@/domain/types';

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
  /** Count habits: type an exact amount (opens the log sheet). */
  onLogAmount?: () => void;
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

/** Slim progress bar under a count or timer habit. The fill is absolute and childless, so it can animate width. */
function ProgressBar({ progress, color, track }: { progress: number; color: string; track: string }) {
  const reduced = useReducedMotion();
  const value = useSharedValue(progress);
  useEffect(() => {
    value.set(reduced ? progress : withTiming(progress, { duration: 380, easing: EASE_OUT }));
  }, [progress, reduced, value]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.min(1, value.get()) * 100}%` }));
  return (
    <View style={[styles.bar, { backgroundColor: track }]} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.barFill, { backgroundColor: color }, fill]} />
    </View>
  );
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
  onLogAmount,
}: HabitRowProps) {
  const { colors, spacing, radius, type, touchTarget, shadow } = useTheme();
  const running = isRunning(entry);
  const now = useNow(running);
  const isCount = habit.type === 'count';
  const isTimer = habit.type === 'timer';
  const complete = isComplete(habit, entry, now);
  const value = entry?.value ?? 0;
  const seconds = elapsedSeconds(entry, now);
  const progress = isCount ? value / habit.target : isTimer ? seconds / (habit.target * 60) : complete ? 1 : 0;
  const accent = complete && !running ? colors.success : habit.color;
  // + adds one round chunk: 1 glass, but 500 of 8,000 steps.
  const step = isCount ? countStep(habit.target) : 1;
  const increaseLabel = step > 1 ? t('today.increaseBy', { step: step.toLocaleString() }) : t('today.increase');
  const decreaseLabel = step > 1 ? t('today.decreaseBy', { step: step.toLocaleString() }) : t('today.decrease');

  const detail = isCount
    ? t('today.countProgress', { value: value.toLocaleString(), target: habit.target.toLocaleString(), unit: habit.unit ?? '' })
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
      case 'logAmount':
        return onLogAmount?.();
      case 'moveUp':
        return onMove?.(-1);
      case 'moveDown':
        return onMove?.(1);
    }
  };

  const ring = touchTarget;
  const round = { width: ring, height: ring, borderRadius: ring / 2, alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityActions={[
        {
          name: 'increment',
          label: isCount ? increaseLabel : t(isTimer ? 'timer.addLabel' : 'today.check', { minutes: TIMER_QUICK_ADD_MINUTES }),
        },
        {
          name: 'decrement',
          label: isCount ? decreaseLabel : t(isTimer ? 'timer.addLabel' : 'today.uncheck', { minutes: -TIMER_QUICK_ADD_MINUTES }),
        },
        { name: 'details', label: t('today.details') },
        ...(isCount && onLogAmount ? [{ name: 'logAmount', label: t('today.log.edit') }] : []),
        ...(onMove
          ? [
              { name: 'moveUp', label: t('today.moveUp') },
              { name: 'moveDown', label: t('today.moveDown') },
            ]
          : []),
      ]}
      onAccessibilityAction={onAction}
      style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md }, shadow(1)]}
    >
      <Pressable
        onPress={onOpen}
        onLongPress={onLongPress}
        delayLongPress={250}
        style={({ pressed }) => [styles.main, { gap: spacing.md, minHeight: touchTarget, opacity: pressed ? 0.6 : 1 }]}
        importantForAccessibility="no"
      >
        {/* The tile turns solid once the habit is done today. */}
        <View style={[styles.tile, { backgroundColor: complete ? habit.color : habit.color + '1F', borderRadius: radius.md + 2 }]}>
          <HabitIcon name={habit.icon} size={24} color={complete ? readableOn(habit.color) : habit.color} strokeWidth={2.1} />
        </View>
        <View style={styles.body}>
          <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]} numberOfLines={2}>
            {habit.name}
          </Text>
          <View style={styles.meta}>
            {isCount && onLogAmount && !hint ? (
              // The amount is its own button: type an exact number instead of tapping + many times.
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('today.log.edit')}
                onPress={onLogAmount}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                style={({ pressed }) => [styles.amount, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{detail}</Text>
                <PencilLine size={13} color={colors.textMuted} strokeWidth={2.25} />
              </Pressable>
            ) : (
              (hint || detail) && (
                <Text style={[type.caption, { color: running ? colors.primary : colors.textMuted, fontWeight: '500' }]}>{hint ?? detail}</Text>
              )
            )}
            <StreakBadge streak={streak} />
          </View>
          {(isCount || isTimer) && <ProgressBar progress={progress} color={accent} track={colors.surfaceAlt} />}
        </View>
      </Pressable>

      {isCount && (
        <View style={styles.controls}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={decreaseLabel}
            disabled={value <= 0}
            onPress={() => onAdjust(-1)}
            scaleTo={0.88}
            style={[round, { opacity: value <= 0 ? 0.3 : 1 }]}
          >
            <Minus size={20} color={colors.textMuted} strokeWidth={2.5} />
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={increaseLabel}
            accessibilityHint={onLogAmount ? t('today.log.hint') : undefined}
            onPress={() => onAdjust(1)}
            onLongPress={onLogAmount}
            delayLongPress={350}
            scaleTo={0.88}
            style={round}
          >
            <ProgressRing size={ring} strokeWidth={3.5} progress={progress} color={accent} trackColor={colors.surfaceAlt}>
              <View style={[styles.inner, { backgroundColor: complete ? accent : habit.color + '1F' }]}>
                {complete ? (
                  <Check size={20} color={readableOn(accent)} strokeWidth={3} />
                ) : step > 1 ? (
                  <Text style={[styles.stepText, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                    +{stepLabel(step)}
                  </Text>
                ) : (
                  <Plus size={20} color={habit.color} strokeWidth={2.75} />
                )}
              </View>
            </ProgressRing>
          </PressableScale>
        </View>
      )}

      {isTimer && (
        <View style={styles.controls}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('timer.addLabel', { minutes: TIMER_QUICK_ADD_MINUTES })}
            onPress={() => onAddMinutes(TIMER_QUICK_ADD_MINUTES)}
            scaleTo={0.9}
            style={[round, { width: ring + 4 }]}
          >
            <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700' }]}>{t('timer.add', { minutes: TIMER_QUICK_ADD_MINUTES })}</Text>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t(running ? 'timer.pause' : 'timer.start')}
            onPress={onTimerToggle}
            scaleTo={0.88}
            style={round}
          >
            <ProgressRing size={ring} strokeWidth={3.5} progress={progress} color={accent} trackColor={colors.surfaceAlt}>
              <View style={[styles.inner, { backgroundColor: running || complete ? accent : habit.color + '1F' }]}>
                {running ? (
                  <Pause size={18} color={readableOn(accent)} strokeWidth={2.75} fill={readableOn(accent)} />
                ) : complete ? (
                  <Check size={20} color={readableOn(accent)} strokeWidth={3} />
                ) : (
                  <Play size={18} color={habit.color} strokeWidth={2.5} fill={habit.color} />
                )}
              </View>
            </ProgressRing>
          </PressableScale>
        </View>
      )}

      {!isCount && !isTimer && <CheckButton checked={complete} color={habit.color} onPress={onToggle} />}
    </View>
  );
}

export const HabitRow = memo(HabitRowBase);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  tile: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  inner: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 11, fontWeight: '800', paddingHorizontal: 2 },
  amount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
});
