import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AdBanner } from '@shared/ads';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReorderableList, { useReorderableDrag, type ReorderableListReorderEvent } from 'react-native-reorderable-list';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { templateById } from '@/data/templates';
import { CelebrationHost } from '@/features/celebrations/CelebrationHost';
import { useCelebrations } from '@/features/celebrations/useCelebrations';
import { CoachMark } from '@/features/onboarding/CoachMark';
import { WidgetPromptSheet } from '@/features/onboarding/WidgetPromptSheet';
import { useFreezeReward } from '@/features/freeze/useFreezeReward';
import { useCelebration } from '@/store/celebrations';
import { useProfile } from '@/store/profile';
import { useNotes } from '@/store/notes';
import { hasCheckInIn } from '@/ads/guard';
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
import { PrimaryButton, TextButton } from '@/ui/controls';
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
  const notes = useNotes((s) => s.notes);
  useCelebrations();
  const [selected, setSelected] = useState<DayKey>(today);
  const profile = useProfile((s) => s.profile);
  const updateProfile = useProfile((s) => s.update);
  const freeze = useFreezeReward();
  const checkedInEver = hasCheckInIn(entries);
  const [widgetSheet, setWidgetSheet] = useState(false);
  const celebration = useCelebration((s) => s.current);

  // Onboarding step 5: the coach-mark goes away with the first check-in.
  useEffect(() => {
    if (checkedInEver && !profile.coachDone) updateProfile({ coachDone: true });
  }, [checkedInEver, profile.coachDone, updateProfile]);

  // ...then, once the first-check-in celebration has played, offer the widget (once).
  useEffect(() => {
    if (celebration?.kind !== 'first' || profile.widgetPromptShown) return;
    const timer = setTimeout(() => {
      updateProfile({ widgetPromptShown: true });
      setWidgetSheet(true);
    }, 3600);
    return () => clearTimeout(timer);
  }, [celebration, profile.widgetPromptShown, updateProfile]);

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

  const atRisk = useMemo(() => {
    let longest = 0;
    for (const h of list) {
      if (h.schedule.kind === 'perWeek' || !isActiveOn(h, today) || !isScheduledOn(h.schedule, today)) continue;
      const e = entries[h.id] ?? {};
      if (isComplete(h, e[today])) continue;
      longest = Math.max(longest, computeStreaks(h, e, today, weekStartsOn).current);
    }
    return longest;
  }, [list, entries, today, weekStartsOn]);
  const showCoach = !profile.coachDone && !checkedInEver && visible.length > 0 && selected === today;

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('note.today')}
          onPress={() => router.push({ pathname: '/note/[date]', params: { date: selected } })}
          style={{ width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name={notes[selected] ? 'note-text' : 'note-edit-outline'} size={24} color={colors.textMuted} />
        </Pressable>
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

      {showCoach && <CoachMark onDismiss={() => updateProfile({ coachDone: true })} />}

      {atRisk >= 2 && freeze.can && !isPast && checkedInEver && (
        <View style={[styles.riskCard, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }]}>
          <Text style={[type.body, { color: colors.text }]}>{t('freeze.atRisk', { count: atRisk })}</Text>
          <PrimaryButton label={t('freeze.watch')} onPress={freeze.earn} disabled={freeze.busy} />
        </View>
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

  const note = notes[selected];
  const footer =
    list.length === 0 ? null : (
      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {allDone && !isPast && (
          <View style={[styles.perfect, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg }]}>
            <Text style={[type.title, { color: colors.text }]}>{t('today.allDoneTitle')}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>{t('today.allDoneBody')}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('note.prompt')} ${note ? note.text : t('note.empty')}`}
          onPress={() => router.push({ pathname: '/note/[date]', params: { date: selected } })}
          style={[styles.perfect, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.lg, minHeight: touchTarget + 8 }]}
        >
          <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
            {note?.mood ? ['😞', '😕', '😐', '🙂', '😄'][note.mood - 1] + ' ' : ''}
            {t('note.prompt')}
          </Text>
          <Text style={[type.body, { color: colors.textMuted }]} numberOfLines={3}>
            {note && note.text !== '' ? note.text : t('note.empty')}
          </Text>
        </Pressable>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.flex}>
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

      <CelebrationHost />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('today.fab')}
        onPress={() => router.push('/habit/new')}
        style={[styles.fab, { backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28 }]}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </Pressable>
      </View>

      {/* Pinned above the tab bar, below the list and the add button so they never overlap. */}
      <AdBanner placement="today_bottom" />

      <WidgetPromptSheet visible={widgetSheet} onClose={() => setWidgetSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  ring: { borderWidth: 4, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  quickAdd: { borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', paddingHorizontal: 16 },
  perfect: { gap: 4 },
  riskCard: {},
  fab: { position: 'absolute', right: 16, bottom: 16, alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
