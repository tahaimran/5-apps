import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Archive from 'lucide-react-native/icons/archive';
import ArchiveRestore from 'lucide-react-native/icons/archive-restore';
import Check from 'lucide-react-native/icons/check';
import Flame from 'lucide-react-native/icons/flame';
import Pencil from 'lucide-react-native/icons/pencil';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Trophy from 'lucide-react-native/icons/trophy';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, ProgressRing } from '@shared/ui';
import { addDays, parseDayKey } from '@/domain/dayKey';
import { isScheduledOn } from '@/domain/schedule';
import type { DayKey } from '@/domain/types';
import { isComplete } from '@/domain/completion';
import { habitCompletion } from '@/domain/percent';
import type { HeatCell } from '@/domain/heatmap';
import { totalCheckIns } from '@/domain/stats';
import { Heatmap } from '@/features/heatmap/Heatmap';
import { useNotes } from '@/store/notes';
import { computeStreaks } from '@/domain/streaks';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { extraColorsFor } from '@/theme/tokens';
import { readableOn } from '@/theme/contrast';
import { HabitIcon } from '@/ui/icons';
import { Screen } from '@/ui/Screen';
import { scheduleLabel } from '@/ui/format';

const RECENT_DAYS = 14;

const pct = (v: number | null) => (v === null ? t('detail.noData') : `${Math.round(v * 100)}%`);

export default function HabitDetail() {
  const { colors, spacing, radius, type, mode } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = useHabits((s) => s.habits[id]);
  const entries = useHabits((s) => s.entries[id]);
  const { archiveHabit, unarchiveHabit, deleteHabit } = useHabits.getState();
  const notes = useNotes((s) => s.notes);
  const [picked, setPicked] = useState<HeatCell | null>(null);
  const today = useToday((s) => s.today);
  const weekStartsOn = useSettings((s) => s.settings.weekStartsOn);

  if (!habit) {
    return (
      <Screen>
        <Stack.Screen options={{ title: '', headerShown: true }} />
        <Text style={[type.body, { color: colors.textMuted }]}>{t('editor.notFound')}</Text>
      </Screen>
    );
  }

  const e = entries ?? {};
  const streak = computeStreaks(habit, e, today, weekStartsOn);
  const unitKey = streak.unit === 'weeks' ? 'detail.weeks' : 'detail.days';
  const archived = !!habit.archivedAt;

  const dayLabel = (day: DayKey) =>
    parseDayKey(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const statusFor = (day: DayKey): string => {
    const entry = e[day];
    const scheduled = isScheduledOn(habit.schedule, day);
    if (isComplete(habit, entry)) return habit.type === 'boolean' ? t('heatmap.done') : valueText(entry?.value ?? 0);
    if (entry?.frozen) return t('heatmap.frozen');
    if (entry && entry.value > 0) return valueText(entry.value);
    return scheduled ? t('heatmap.notDone') : t('heatmap.unscheduled');
  };
  const valueText = (value: number) =>
    habit.type === 'count'
      ? t('heatmap.count', { value, target: habit.target, unit: habit.unit ?? '' })
      : habit.type === 'timer'
        ? t('heatmap.minutes', { minutes: Math.floor(value / 60), target: habit.target })
        : t('heatmap.done');
  const recent = Array.from({ length: RECENT_DAYS }, (_, i) => addDays(today, -i)).filter((d) => d >= habit.createdAt);

  const confirmDelete = () =>
    Alert.alert(t('detail.deleteTitle'), t('detail.deleteBody', { name: habit.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteHabit(id);
        },
      },
    ]);

  const completion = [
    { label: t('detail.last7'), value: habitCompletion(habit, e, today, 7, weekStartsOn) },
    { label: t('detail.last30'), value: habitCompletion(habit, e, today, 30, weekStartsOn) },
    { label: t('detail.allTime'), value: habitCompletion(habit, e, today, 'all', weekStartsOn) },
  ];

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: '', headerShown: true }} />

      <View style={[styles.hero, { backgroundColor: habit.color + '1F', borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg }]}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: habit.color, borderRadius: radius.lg }]}>
            <HabitIcon name={habit.icon} size={30} color={readableOn(habit.color)} />
          </View>
          <View style={styles.flex}>
            <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{habit.name}</Text>
            <Text style={[type.body, { color: colors.textMuted, fontWeight: '500' }]}>{scheduleLabel(habit.schedule)}</Text>
          </View>
        </View>
        <View style={styles.streaks}>
          <View style={styles.streakBlock} accessible accessibilityLabel={`${t('detail.currentStreak')}: ${t(unitKey, { count: streak.current })}`}>
            <View style={styles.streakValue}>
              <Flame size={26} color={colors.accent} fill={colors.accent} strokeWidth={2} />
              <Text style={[type.display, { color: colors.text, fontWeight: '800' }]}>{streak.current}</Text>
            </View>
            <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{t('detail.currentStreak')}</Text>
          </View>
          <View style={[styles.vrule, { backgroundColor: colors.text + '1A' }]} />
          <View style={styles.streakBlock} accessible accessibilityLabel={`${t('detail.bestStreak')}: ${t(unitKey, { count: streak.best })}`}>
            <View style={styles.streakValue}>
              <Trophy size={24} color={colors.textMuted} strokeWidth={2} />
              <Text style={[type.display, { color: colors.text, fontWeight: '800' }]}>{streak.best}</Text>
            </View>
            <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{t('detail.bestStreak')}</Text>
          </View>
        </View>
      </View>

      {archived && (
        <Card level={0} style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={[type.body, { color: colors.text }]}>{t('detail.archivedBanner')}</Text>
        </Card>
      )}

      <Card style={{ gap: spacing.lg }}>
        <View style={styles.rowBetween}>
          <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('detail.completion')}</Text>
          <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>
            {t('detail.totalCheckIns')}: {totalCheckIns(habit, e)}
          </Text>
        </View>
        <View style={styles.rings}>
          {completion.map((c) => (
            <View key={c.label} style={styles.ringCell} accessible accessibilityLabel={`${c.label}: ${pct(c.value)}`}>
              <ProgressRing size={76} strokeWidth={8} progress={c.value ?? 0} color={habit.color} trackColor={colors.surfaceAlt}>
                <Text style={[type.body, { color: colors.text, fontWeight: '800' }]}>{pct(c.value)}</Text>
              </ProgressRing>
              <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{c.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Heatmap
          habit={habit}
          entries={e}
          today={today}
          weekStartsOn={weekStartsOn}
          selected={picked?.day ?? null}
          onSelect={setPicked}
        />
        <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted }]}>
          {picked ? t('detail.recentRow', { date: dayLabel(picked.day), status: statusFor(picked.day) }) : habit.createdAt >= addDays(today, -7) ? t('detail.newHabit') : t('heatmap.pick')}
        </Text>
      </Card>

      <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('detail.recent')}</Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {recent.map((day, i) => {
          const done = isComplete(habit, e[day]);
          const frozen = !done && !!e[day]?.frozen;
          return (
            <View
              key={day}
              style={[styles.recentRow, { paddingHorizontal: spacing.lg, gap: spacing.md, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, borderColor: colors.border }]}
              accessible
              accessibilityLabel={t('detail.recentRow', { date: dayLabel(day), status: statusFor(day) })}
            >
              <View
                style={[
                  styles.status,
                  { backgroundColor: done ? habit.color : frozen ? extraColorsFor(mode).frozen + '44' : colors.surfaceAlt },
                ]}
              >
                {done ? <Check size={16} color={readableOn(habit.color)} strokeWidth={3} /> : frozen ? <Snowflake size={14} color={colors.text} /> : null}
              </View>
              <View style={styles.flex}>
                <Text style={[type.body, { color: colors.text, fontWeight: '600' }]}>{dayLabel(day)}</Text>
                {notes[day] && <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>{notes[day].text}</Text>}
              </View>
              <Text style={[type.body, { color: done ? colors.text : colors.textMuted }]}>{statusFor(day)}</Text>
            </View>
          );
        })}
      </Card>

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        {!archived && <Button label={t('detail.edit')} icon={Pencil} onPress={() => router.push({ pathname: '/habit/[id]/edit', params: { id } })} />}
        {archived ? (
          <Button label={t('detail.unarchive')} icon={ArchiveRestore} onPress={() => unarchiveHabit(id)} />
        ) : (
          <Button
            label={t('detail.archive')}
            icon={Archive}
            variant="secondary"
            block
            onPress={() => {
              archiveHabit(id, today);
              router.back();
            }}
          />
        )}
        <Button label={t('detail.delete')} variant="danger" block onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {},
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  streaks: { flexDirection: 'row', alignItems: 'center' },
  streakBlock: { flex: 1, gap: 2 },
  streakValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vrule: { width: 1, alignSelf: 'stretch', marginHorizontal: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rings: { flexDirection: 'row', justifyContent: 'space-between' },
  ringCell: { alignItems: 'center', gap: 8, flex: 1 },
  recentRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: 8 },
  status: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
