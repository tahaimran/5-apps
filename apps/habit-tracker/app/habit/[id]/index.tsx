import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
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
import { Screen } from '@/ui/Screen';
import { PrimaryButton, TextButton } from '@/ui/controls';
import { scheduleLabel } from '@/ui/format';

const RECENT_DAYS = 14;

const pct = (v: number | null) => (v === null ? t('detail.noData') : `${Math.round(v * 100)}%`);

export default function HabitDetail() {
  const { colors, spacing, radius, type } = useTheme();
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

  const stat = (label: string, value: string) => (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[type.title, { color: colors.text, fontWeight: '700' }]}>{value}</Text>
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: habit.name, headerShown: true }} />
      <View style={[styles.band, { backgroundColor: habit.color + '26', borderRadius: radius.lg, padding: spacing.lg }]}>
        <View style={[styles.bandIcon, { backgroundColor: habit.color, borderRadius: radius.md }]}>
          <MaterialCommunityIcons name={habit.icon as never} size={28} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={[type.title, { color: colors.text }]}>{habit.name}</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>{scheduleLabel(habit.schedule)}</Text>
        </View>
      </View>

      {archived && (
        <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md }}>
          <Text style={[type.body, { color: colors.text }]}>{t('detail.archivedBanner')}</Text>
        </View>
      )}

      <View style={styles.statRow}>
        {stat(t('detail.currentStreak'), t(unitKey, { count: streak.current }))}
        {stat(t('detail.bestStreak'), t(unitKey, { count: streak.best }))}
      </View>

      <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '600', marginTop: spacing.md }]}>
        {t('detail.completion')}
      </Text>
      <View style={styles.statRow}>
        {stat(t('detail.last7'), pct(habitCompletion(habit, e, today, 7, weekStartsOn)))}
        {stat(t('detail.last30'), pct(habitCompletion(habit, e, today, 30, weekStartsOn)))}
        {stat(t('detail.allTime'), pct(habitCompletion(habit, e, today, 'all', weekStartsOn)))}
      </View>

      {stat(t('detail.totalCheckIns'), String(totalCheckIns(habit, e)))}

      <Heatmap
        habit={habit}
        entries={e}
        today={today}
        weekStartsOn={weekStartsOn}
        selected={picked?.day ?? null}
        onSelect={setPicked}
      />
      <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted }]}>
        {picked ? `${dayLabel(picked.day)} · ${statusFor(picked.day)}` : habit.createdAt >= addDays(today, -7) ? t('detail.newHabit') : t('heatmap.pick')}
      </Text>

      <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '600', marginTop: spacing.md }]}>
        {t('detail.recent')}
      </Text>
      {recent.map((day) => (
        <View key={day} style={[styles.recentRow, { borderColor: colors.border }]} accessible accessibilityLabel={t('detail.recentRow', { date: dayLabel(day), status: statusFor(day) })}>
          <Text style={[type.body, { color: colors.text }]}>{dayLabel(day)}</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>{statusFor(day)}</Text>
          {notes[day] && <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>{notes[day].text}</Text>}
        </View>
      ))}

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        {!archived && <PrimaryButton label={t('detail.edit')} onPress={() => router.push({ pathname: '/habit/[id]/edit', params: { id } })} />}
        {archived ? (
          <PrimaryButton label={t('detail.unarchive')} onPress={() => unarchiveHabit(id)} />
        ) : (
          <TextButton
            label={t('detail.archive')}
            onPress={() => {
              archiveHabit(id, today);
              router.back();
            }}
          />
        )}
        <TextButton label={t('detail.delete')} danger onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  band: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bandIcon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderWidth: StyleSheet.hairlineWidth },
  recentRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
});
