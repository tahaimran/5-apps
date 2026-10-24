import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReorderableList, { useReorderableDrag, type ReorderableListReorderEvent } from 'react-native-reorderable-list';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import History from 'lucide-react-native/icons/rotate-ccw-clock';
import NotebookPen from 'lucide-react-native/icons/notebook-pen';
import Plus from 'lucide-react-native/icons/plus';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Sun from 'lucide-react-native/icons/sun';
import Undo2 from 'lucide-react-native/icons/undo-2';
import { AdBanner } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, IconButton, PressableScale, showToast } from '@shared/ui';
import { templateById } from '@/data/templates';
import { CelebrationHost } from '@/features/celebrations/CelebrationHost';
import { useCelebrations } from '@/features/celebrations/useCelebrations';
import { CoachMark } from '@/features/onboarding/CoachMark';
import { WidgetPromptSheet } from '@/features/onboarding/WidgetPromptSheet';
import { useFreezeReward } from '@/features/freeze/useFreezeReward';
import { LogAmountSheet } from '@/features/today/LogAmountSheet';
import { TodayHero } from '@/features/today/TodayHero';
import { useCelebration } from '@/store/celebrations';
import { useProfile } from '@/store/profile';
import { useNotes } from '@/store/notes';
import { hasCheckInIn } from '@/ads/guard';
import { isComplete } from '@/domain/completion';
import { countStep } from '@/domain/countStep';
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
import { HabitIcon } from '@/ui/icons';
import { MoodIcon } from '@/ui/mood';
import { TextButton } from '@/ui/controls';
import { WeekStrip } from '@/ui/WeekStrip';

/** Offered in the empty state until the user picks their own. */
const STARTER_TEMPLATES = ['drink-water', 'make-bed', 'walk-daily'];

const greetingKey = (hour: number) =>
  hour < 12 ? 'today.greeting.morning' : hour < 18 ? 'today.greeting.afternoon' : 'today.greeting.evening';

const longDate = (day: DayKey) =>
  parseDayKey(day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const shortDate = (day: DayKey) =>
  parseDayKey(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/** A row that starts a drag on long press. */
function DraggableRow(props: HabitRowProps) {
  const drag = useReorderableDrag();
  return <HabitRow {...props} onLongPress={drag} />;
}

export default function Today() {
  const { colors, spacing, radius, type, touchTarget, mode, shadow } = useTheme();
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
  const [logFor, setLogFor] = useState<Habit | null>(null);
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
  const warning = extraColorsFor(mode).warning;

  const streaks = useMemo(() => {
    const out: Record<string, ReturnType<typeof computeStreaks>> = {};
    for (const h of list) out[h.id] = computeStreaks(h, entries[h.id] ?? {}, today, weekStartsOn);
    return out;
  }, [list, entries, today, weekStartsOn]);
  const bestStreak = useMemo(
    () => list.reduce((best, h) => (streaks[h.id]?.unit === 'days' ? Math.max(best, streaks[h.id].current) : best), 0),
    [list, streaks],
  );

  const atRisk = useMemo(() => {
    let longest = 0;
    for (const h of list) {
      if (h.schedule.kind === 'perWeek' || !isActiveOn(h, today) || !isScheduledOn(h.schedule, today)) continue;
      if (isComplete(h, entries[h.id]?.[today])) continue;
      longest = Math.max(longest, streaks[h.id]?.current ?? 0);
    }
    return longest;
  }, [list, entries, today, streaks]);
  const showCoach = !profile.coachDone && !checkedInEver && visible.length > 0 && selected === today;

  const toggle = useCallback(
    (habit: Habit) => {
      const before = entries[habit.id]?.[selected]?.value ?? 0;
      const complete = isComplete(habit, entries[habit.id]?.[selected]);
      const day = selected;
      setValue(habit.id, day, complete ? 0 : habit.type === 'count' ? habit.target : habit.type === 'timer' ? habit.target * 60 : 1);
      if (complete) {
        feedback.undo();
        // A mis-tap on a done habit is easy to make and annoying to redo (it may hold a count or time).
        showToast({
          message: t('today.unchecked', { name: habit.name }),
          icon: Undo2,
          action: { label: t('common.undo'), onPress: () => setValue(habit.id, day, before) },
        });
      } else feedback.done();
    },
    [entries, selected, setValue, feedback],
  );

  const adjust = useCallback(
    (habit: Habit, delta: 1 | -1) => {
      const before = entries[habit.id]?.[selected]?.value ?? 0;
      const next = Math.max(0, before + delta * countStep(habit.target));
      setValue(habit.id, selected, next);
      if (delta < 0) feedback.undo();
      else if (isComplete(habit, { value: next, updatedAt: 0 }) && before < habit.target) feedback.complete();
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

  /** Exact amount from the log sheet (count habits). */
  const logAmount = useCallback(
    (habit: Habit, next: number) => {
      const before = entries[habit.id]?.[selected]?.value ?? 0;
      if (next === before) return;
      setValue(habit.id, selected, next);
      if (next < before) feedback.undo();
      else if (before < habit.target && next >= habit.target) feedback.complete();
      else feedback.check();
    },
    [entries, selected, setValue, feedback],
  );

  const onReorder = ({ from, to }: ReorderableListReorderEvent) =>
    setOrder(applyVisibleReorder(habitOrder, visible.map((h) => h.id), from, to));

  const openNote = () => router.push({ pathname: '/note/[date]', params: { date: selected } });

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{longDate(today)}</Text>
          <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>
            {t(greetingKey(new Date().getHours()))}
          </Text>
        </View>
        <IconButton icon={NotebookPen} label={t('note.today')} variant="tonal" onPress={openNote} />
      </View>

      {list.length > 0 && (
        <WeekStrip days={days} today={today} selected={selected} progress={progressByDay} onSelect={setSelected} />
      )}

      {isPast && (
        <View style={[styles.banner, { backgroundColor: warning + '26', borderRadius: radius.lg, paddingLeft: spacing.lg, gap: spacing.sm }]}>
          <History size={20} color={colors.text} strokeWidth={2.25} />
          <Text style={[type.body, { color: colors.text, flex: 1, fontWeight: '600' }]}>{t('today.editingDay', { date: shortDate(selected) })}</Text>
          <TextButton label={t('today.backToToday')} onPress={() => setSelected(today)} />
        </View>
      )}

      {visible.length > 0 && <TodayHero done={progress.done} total={progress.total} streak={bestStreak} past={isPast} />}

      {showCoach && <CoachMark onDismiss={() => updateProfile({ coachDone: true })} />}

      {atRisk >= 2 && freeze.can && !isPast && checkedInEver && (
        <Card style={{ gap: spacing.md }}>
          <View style={styles.rowCenter}>
            <View style={[styles.iconTile, { backgroundColor: extraColorsFor(mode).frozen + '33', borderRadius: radius.md }]}>
              <Snowflake size={22} color={colors.text} strokeWidth={2.25} />
            </View>
            <Text style={[type.body, { color: colors.text, flex: 1, fontWeight: '600' }]}>{t('freeze.atRisk', { count: atRisk })}</Text>
          </View>
          <Button label={t('freeze.watch')} variant="secondary" onPress={freeze.earn} loading={freeze.busy} />
        </Card>
      )}

      {list.length === 0 && (
        <Card style={{ gap: spacing.lg, padding: spacing.xl }}>
          <View style={[styles.emptyArt, { backgroundColor: colors.primarySoft }]}>
            <Sparkles size={36} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t('today.emptyTitle')}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>{t('today.emptyBody')}</Text>
          </View>
          <View style={{ gap: spacing.sm }}>
            {STARTER_TEMPLATES.map((id) => {
              const tpl = templateById(id);
              if (!tpl) return null;
              const name = t(`templates.${id}.name`);
              return (
                <PressableScale
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={t('today.quickAdd', { name })}
                  onPress={() => {
                    addHabit(draftFromTemplate(tpl, today));
                    feedback.check();
                  }}
                  scaleTo={0.98}
                  style={[styles.quickAdd, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, minHeight: touchTarget + 12, gap: spacing.md }]}
                >
                  <HabitIcon name={tpl.icon} size={22} color={colors.primary} />
                  <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600', flex: 1 }]}>{name}</Text>
                  <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                </PressableScale>
              );
            })}
          </View>
          <TextButton label={t('today.browse')} onPress={() => router.push('/templates')} />
        </Card>
      )}

      {list.length > 0 && visible.length === 0 && (
        <Card style={[styles.rowCenter, { gap: spacing.md }]}>
          <Sun size={26} color={colors.accent} strokeWidth={2.25} />
          <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{t('today.restDay')}</Text>
        </Card>
      )}
    </View>
  );

  const note = notes[selected];
  const footer =
    list.length === 0 ? null : (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${t('note.prompt')} ${note ? note.text : t('note.empty')}`}
        onPress={openNote}
        scaleTo={0.98}
        style={[styles.note, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, marginTop: spacing.lg }, shadow(1)]}
      >
        <View style={[styles.iconTile, { backgroundColor: colors.primarySoft, borderRadius: radius.md }]}>
          {note?.mood ? <MoodIcon mood={note.mood} size={24} color={colors.primary} /> : <NotebookPen size={22} color={colors.primary} strokeWidth={2.25} />}
        </View>
        <View style={styles.flex}>
          <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t('note.prompt')}</Text>
          <Text style={[type.body, { color: colors.textMuted }]} numberOfLines={2}>
            {note && note.text !== '' ? note.text : t('note.empty')}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </PressableScale>
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
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: touchTarget + spacing.xxl * 2 }}
          renderItem={({ item: habit }) => (
            <DraggableRow
              habit={habit}
              entry={entries[habit.id]?.[selected]}
              streak={streaks[habit.id] ?? computeStreaks(habit, entries[habit.id] ?? {}, today, weekStartsOn)}
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
              onLogAmount={habit.type === 'count' ? () => setLogFor(habit) : undefined}
            />
          )}
        />

        <CelebrationHost />

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('today.fab')}
          onPress={() => router.push('/habit/new')}
          scaleTo={0.9}
          style={[styles.fab, { backgroundColor: colors.primary }, shadow(3)]}
        >
          <Plus size={28} color={colors.onPrimary} strokeWidth={2.5} />
        </PressableScale>
      </View>

      {/* Pinned above the tab bar, below the list and the add button so they never overlap. */}
      <AdBanner placement="today_bottom" />

      <WidgetPromptSheet visible={widgetSheet} onClose={() => setWidgetSheet(false)} />
      <LogAmountSheet
        habit={logFor}
        value={logFor ? (entries[logFor.id]?.[selected]?.value ?? 0) : 0}
        onSave={(value) => logFor && logAmount(logFor, value)}
        onClose={() => setLogFor(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  banner: { flexDirection: 'row', alignItems: 'center' },
  iconTile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emptyArt: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quickAdd: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  note: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});
