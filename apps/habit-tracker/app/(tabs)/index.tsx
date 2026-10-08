import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReorderableList, { useReorderableDrag, type ReorderableListReorderEvent } from 'react-native-reorderable-list';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { templateById } from '@/data/templates';
import { isComplete } from '@/domain/completion';
import { parseDayKey, weekDays } from '@/domain/dayKey';
import { dayProgress, type DayProgress } from '@/domain/percent';
import { applyVisibleReorder } from '@/domain/reorder';
import { isActiveOn, isScheduledOn } from '@/domain/schedule';
import { computeStreaks, weekCount } from '@/domain/streaks';
import { elapsedSeconds, isRunning } from '@/domain/timer';
import type { DayKey, Habit } from '@/domain/types';
import { draftFromTemplate } from '@/features/habit-editor/drafts';
import { useFeedback } from '@/store/feedback';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { extraColorsFor } from '@/theme/tokens';
import { HabitRow, type HabitRowProps } from '@/ui/HabitRow';
import { TextButton } from '@/ui/controls';
import { WeekStrip } from '@/ui/WeekStrip';

/** Offered in the empty state until the user picks their own. */
const STARTER_TEMPLATES = ['drink-water', 'make-bed', 'walk-daily'];

const greetingKey = (hour: number) =>
  hour < 12 ? 'today.greeting.morning' : hour < 18 ? 'today.greeting.afternoon' : 'today.greeting.evening';

const longDate = (day: DayKey) =>
  parseDayKey(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/** A row that starts a drag on long press. */
function DraggableRow(props: HabitRowProps) {
  const drag = useReorderableDrag();
  return <HabitRow {...props} onLongPress={drag} />;
}

export default function Today() {
  const { colors, spacing, radius, type, touchTarget, mode } = useTheme();
  const today = useToday((s) => s.today);
  const weekStartsOn = useSettings((s) => s.settings.weekStartsOn);
  const { habits, habitOrder, entries, addHabit, setValue, setOrder, move, startTimer, pauseTimer, addMinutes } = useHabits();
  const feedback = useFeedback();
  const [selected, setSelected] = useState<DayKey>(today);

  // Jump back to today when the day rolls over.
  useEffect(() => setSelected(today), [today]);

  const list = useMemo(() => habitOrder.map((id) => habits[id]).filter((h) => h && !h.archivedAt), [habits, habitOrder]);
  const days = useMemo(() => weekDays(today, weekStartsOn), [today, weekStartsOn]);
  const progressByDay = useMemo(() => {
    const out = {} as Record<DayKey, DayProgress>;
    for (const day of days) out[day] = dayProgress(list, entries, day, weekStartsOn);
    return out;
  }, [days, list, entries, weekStartsOn]);

  const visible = useMemo(
    () => list.filter((h) => isActiveOn(h, selected) && isScheduledOn(h.schedule, selected)),
    [list, selected],
  );
  const progress = progressByDay[selected] ?? dayProgress(list, entries, selected, weekStartsOn);
  const isPast = selected !== today;
  const allDone = progress.total > 0 && progress.done === progress.total;
  const warning = extraColorsFor(mode).warning;

  const toggle = useCallback(
    (habit: Habit) => {
      const complete = isComplete(habit, entries[habit.id]?.[selected]);
      setValue(habit.id, selected, complete ? 0 : habit.type === 'count' ? habit.target : habit.type === 'timer' ? habit.target * 60 : 1);
      if (complete) feedback.undo();
      else feedback.complete();
    },
    [entries, selected, setValue, feedback],
  );

  const adjust = useCallback(
    (habit: Habit, delta: 1 | -1) => {
      const before = entries[habit.id]?.[selected]?.value ?? 0;
      const next = Math.max(0, before + delta);
      setValue(habit.id, selected, next);
      if (delta < 0) feedback.undo();
      else if (isComplete(habit, { value: next, updatedAt: 0 })) feedback.complete();
      else feedback.check();
    },
    [entries, selected, setValue, feedback],
  );

  const toggleTimer = useCallback(
    (habit: Habit) => {
      const entry = entries[habit.id]?.[selected];
      if (isRunning(entry)) {
        const wasComplete = isComplete(habit, entry);
        pauseTimer(habit.id, selected);
        if (!wasComplete && elapsedSeconds(entry, Date.now()) >= habit.target * 60) feedback.complete();
        else feedback.check();
      } else if (selected === today) {
        startTimer(habit.id, selected);
        feedback.check();
      }
    },
    [entries, selected, today, pauseTimer, startTimer, feedback],
  );

  const addMins = useCallback(
    (habit: Habit, minutes: number) => {
      const before = entries[habit.id]?.[selected];
      addMinutes(habit.id, selected, minutes);
      const after = elapsedSeconds(before, Date.now()) + minutes * 60;
      if (minutes < 0) feedback.undo();
      else if (!isComplete(habit, before, Date.now()) && after >= habit.target * 60) feedback.complete();
      else feedback.check();
    },
    [entries, selected, addMinutes, feedback],
  );

  const onReorder = ({ from, to }: ReorderableListReorderEvent) =>
    setOrder(applyVisibleReorder(habitOrder, visible.map((h) => h.id), from, to));

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={[type.title, { color: colors.text }]}>
            {t(greetingKey(new Date().getHours()))}
          </Text>
          <Text style={[type.body, { color: colors.textMuted }]}>{longDate(today)}</Text>
        </View>
        {progress.total > 0 && (
          <View
            accessible
            accessibilityLabel={t('today.ringLabel', { done: progress.done, total: progress.total })}
            style={[styles.ring, { borderColor: allDone ? colors.success : colors.primary, minWidth: touchTarget + 8, height: touchTarget + 8 }]}
          >
            <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>
              {progress.done}/{progress.total}
            </Text>
          </View>
        )}
      </View>

      {list.length > 0 && (
        <WeekStrip days={days} today={today} selected={selected} progress={progressByDay} onSelect={setSelected} />
      )}

      {isPast && (
        <View style={{ backgroundColor: warning + '26', borderRadius: radius.md, padding: spacing.md }}>
          <Text style={[type.body, { color: colors.text }]}>{t('today.editingDay', { date: longDate(selected) })}</Text>
        </View>
      )}

      {list.length === 0 && (
        <View style={{ gap: spacing.md }}>
          <Text style={[type.title, { color: colors.text }]}>{t('today.emptyTitle')}</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>{t('today.emptyBody')}</Text>
          {STARTER_TEMPLATES.map((id) => {
            const tpl = templateById(id);
            if (!tpl) return null;
            const name = t(`templates.${id}.name`);
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={t('today.quickAdd', { name })}
                onPress={() => addHabit(draftFromTemplate(tpl, today))}
                style={[styles.quickAdd, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, minHeight: touchTarget + 8 }]}
              >
                <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>+ {name}</Text>
              </Pressable>
            );
          })}
          <TextButton label={t('today.browse')} onPress={() => router.push('/templates')} />
        </View>
      )}

      {list.length > 0 && visible.length === 0 && (
        <Text style={[type.body, { color: colors.textMuted }]}>{t('today.restDay')}</Text>
      )}
    </View>
  );

  const footer =
    allDone && !isPast ? (
      <View style={[styles.perfect, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.md }]}>
        <Text style={[type.title, { color: colors.text }]}>{t('today.allDoneTitle')}</Text>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('today.allDoneBody')}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ReorderableList
        data={visible}
        keyExtractor={(h) => h.id}
        onReorder={onReorder}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: touchTarget + spacing.xxl * 2 }}
        renderItem={({ item: habit }) => (
          <DraggableRow
            habit={habit}
            entry={entries[habit.id]?.[selected]}
            streak={computeStreaks(habit, entries[habit.id] ?? {}, today, weekStartsOn)}
            hint={
              habit.schedule.kind === 'perWeek'
                ? t('today.perWeek', { done: weekCount(habit, entries[habit.id] ?? {}, selected, weekStartsOn), times: habit.schedule.times })
                : undefined
            }
            onToggle={() => toggle(habit)}
            onAdjust={(delta) => adjust(habit, delta)}
            onTimerToggle={() => toggleTimer(habit)}
            onAddMinutes={(m) => addMins(habit, m)}
            onOpen={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
            onMove={(delta) => move(habit.id, delta)}
          />
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('today.fab')}
        onPress={() => router.push('/habit/new')}
        style={[styles.fab, { backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28 }]}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  ring: { borderWidth: 4, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  quickAdd: { borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', paddingHorizontal: 16 },
  perfect: { gap: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16, alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
