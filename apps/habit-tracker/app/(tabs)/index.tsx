import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { quickAdds } from '@/data/quickAdds';
import { isComplete } from '@/domain/completion';
import { parseDayKey, weekDays } from '@/domain/dayKey';
import { dayProgress, type DayProgress } from '@/domain/percent';
import { isActiveOn, isScheduledOn } from '@/domain/schedule';
import { computeStreaks, weekCount } from '@/domain/streaks';
import type { DayKey } from '@/domain/types';
import { extraColorsFor } from '@/theme/tokens';
import { useFeedback } from '@/store/feedback';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { HabitRow } from '@/ui/HabitRow';
import { Screen } from '@/ui/Screen';
import { WeekStrip } from '@/ui/WeekStrip';

const greetingKey = (hour: number) =>
  hour < 12 ? 'today.greeting.morning' : hour < 18 ? 'today.greeting.afternoon' : 'today.greeting.evening';

const longDate = (day: DayKey) =>
  parseDayKey(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function Today() {
  const { colors, spacing, radius, type, touchTarget, mode } = useTheme();
  const today = useToday((s) => s.today);
  const weekStartsOn = useSettings((s) => s.settings.weekStartsOn);
  const { habits, habitOrder, entries, addHabit, setValue } = useHabits();
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

  const visible = list.filter((h) => isActiveOn(h, selected) && isScheduledOn(h.schedule, selected));
  const progress = progressByDay[selected] ?? dayProgress(list, entries, selected, weekStartsOn);
  const isPast = selected !== today;
  const allDone = progress.total > 0 && progress.done === progress.total;
  const warning = extraColorsFor(mode).warning;

  const toggle = useCallback(
    (id: string) => {
      const habit = habits[id];
      const complete = isComplete(habit, entries[id]?.[selected]);
      setValue(id, selected, complete ? 0 : habit.type === 'count' ? habit.target : habit.type === 'timer' ? habit.target * 60 : 1);
      if (complete) feedback.undo();
      else feedback.complete();
    },
    [habits, entries, selected, setValue, feedback],
  );

  const adjust = useCallback(
    (id: string, delta: 1 | -1) => {
      const habit = habits[id];
      const before = entries[id]?.[selected]?.value ?? 0;
      const next = Math.max(0, before + delta);
      setValue(id, selected, next);
      if (delta < 0) feedback.undo();
      else if (isComplete(habit, { value: next, updatedAt: 0 })) feedback.complete();
      else feedback.check();
    },
    [habits, entries, selected, setValue, feedback],
  );

  return (
    <Screen>
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
        <View style={[styles.banner, { backgroundColor: warning + '26', borderRadius: radius.md, padding: spacing.md }]}>
          <Text style={[type.body, { color: colors.text }]}>{t('today.editingDay', { date: longDate(selected) })}</Text>
        </View>
      )}

      {list.length === 0 && (
        <View style={{ gap: spacing.md }}>
          <Text style={[type.title, { color: colors.text }]}>{t('today.emptyTitle')}</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>{t('today.emptyBody')}</Text>
          {quickAdds.map((q) => (
            <Pressable
              key={q.templateId}
              accessibilityRole="button"
              accessibilityLabel={t('today.quickAdd', { name: q.name })}
              onPress={() => addHabit(q, today)}
              style={[styles.quickAdd, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, minHeight: touchTarget + 8 }]}
            >
              <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>+ {q.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {list.length > 0 && visible.length === 0 && (
        <Text style={[type.body, { color: colors.textMuted }]}>{t('today.restDay')}</Text>
      )}

      {visible.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          entry={entries[habit.id]?.[selected]}
          streak={computeStreaks(habit, entries[habit.id] ?? {}, today, weekStartsOn)}
          hint={
            habit.schedule.kind === 'perWeek'
              ? t('today.perWeek', { done: weekCount(habit, entries[habit.id] ?? {}, selected, weekStartsOn), times: habit.schedule.times })
              : undefined
          }
          onToggle={() => toggle(habit.id)}
          onAdjust={(delta) => adjust(habit.id, delta)}
        />
      ))}

      {allDone && !isPast && (
        <View style={[styles.perfect, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg }]}>
          <Text style={[type.title, { color: colors.text }]}>{t('today.allDoneTitle')}</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>{t('today.allDoneBody')}</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  ring: { borderWidth: 4, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  banner: {},
  quickAdd: { borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', paddingHorizontal: 16 },
  perfect: { gap: 4 },
});
