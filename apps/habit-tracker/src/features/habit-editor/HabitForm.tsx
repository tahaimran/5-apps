import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { habitIcons } from '@/data/icons';
import { categories } from '@/domain/categories';
import { addDays, daysBetween, parseDayKey } from '@/domain/dayKey';
import type { DayKey, Schedule, Weekday } from '@/domain/types';
import { COUNT_MAX, NAME_MAX, TIMER_MAX_MINUTES, validateDraft, type HabitDraft } from '@/domain/validate';
import { habitColors } from '@/theme/tokens';
import { Chip, Field, PrimaryButton, Segmented, Stepper, TextField, TimeStepper } from '@/ui/controls';

export interface HabitFormProps {
  initial: HabitDraft;
  today: DayKey;
  submitLabel: string;
  onSubmit: (draft: HabitDraft) => void;
  /** Shown above the form (e.g. "Start from a template"). */
  header?: React.ReactNode;
}

// Monday-first display order; values are 0 = Sunday.
const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
const MAX_DAYS_BACK = 365;

const weekdayName = (d: Weekday) =>
  new Date(2026, 9, 4 + d).toLocaleDateString(undefined, { weekday: 'short' }); // 2026-10-04 is a Sunday

export function HabitForm({ initial, today, submitLabel, onSubmit, header }: HabitFormProps) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const navigation = useNavigation();
  const [draft, setDraft] = useState<HabitDraft>(initial);
  const [touched, setTouched] = useState(false);
  const submitted = useRef(false);
  const initialJson = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(draft) !== initialJson.current;

  const patch = (p: Partial<HabitDraft>) => setDraft((d) => ({ ...d, ...p }));
  const errors = validateDraft(draft);
  const valid = Object.keys(errors).length === 0;

  // Closing with unsaved changes asks first.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!dirty || submitted.current) return;
      e.preventDefault();
      Alert.alert(t('editor.discardTitle'), t('editor.discardBody'), [
        { text: t('common.keepEditing'), style: 'cancel' },
        { text: t('common.discard'), style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, dirty]);

  const setSchedule = (kind: Schedule['kind']) =>
    patch({
      schedule:
        kind === 'daily' ? { kind } : kind === 'weekdays' ? { kind, days: [1, 2, 3, 4, 5] } : { kind, times: 3 },
    });

  const toggleDay = (day: Weekday) => {
    if (draft.schedule.kind !== 'weekdays') return;
    const days = draft.schedule.days.includes(day)
      ? draft.schedule.days.filter((d) => d !== day)
      : [...draft.schedule.days, day];
    patch({ schedule: { kind: 'weekdays', days } });
  };

  const lastReminder = useRef('08:00');
  if (draft.reminderTime !== null) lastReminder.current = draft.reminderTime;

  const nameError = touched && errors.name ? t(errors.name === 'required' ? 'editor.nameRequired' : 'editor.nameTooLong') : undefined;
  const targetMax = draft.type === 'timer' ? TIMER_MAX_MINUTES : COUNT_MAX;

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    submitted.current = true;
    onSubmit(draft);
  };

  const daysBack = daysBetween(draft.createdAt, today);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
        {header}

        <Field label={t('editor.name')} error={nameError}>
          <TextField
            value={draft.name}
            onChangeText={(name) => {
              patch({ name });
              setTouched(true);
            }}
            label={t('editor.name')}
            placeholder={t('editor.namePlaceholder')}
            maxLength={NAME_MAX + 10}
            invalid={!!nameError}
          />
        </Field>

        <Field label={t('editor.icon')}>
          <View style={styles.wrap}>
            {habitIcons.map((icon) => {
              const selected = icon === draft.icon;
              return (
                <Pressable
                  key={icon}
                  accessibilityRole="button"
                  accessibilityLabel={t('editor.iconLabel', { name: icon.replace(/-/g, ' ') })}
                  accessibilityState={{ selected }}
                  onPress={() => patch({ icon })}
                  style={[
                    styles.iconCell,
                    {
                      width: touchTarget,
                      height: touchTarget,
                      borderRadius: radius.md,
                      backgroundColor: selected ? draft.color + '33' : colors.surface,
                      borderColor: selected ? draft.color : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={icon} size={24} color={selected ? draft.color : colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label={t('editor.color')}>
          <View style={styles.wrap}>
            {Object.values(habitColors).map((color, i) => {
              const selected = color === draft.color;
              return (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  accessibilityLabel={t('editor.colorLabel', { index: i + 1 })}
                  accessibilityState={{ selected }}
                  onPress={() => patch({ color })}
                  style={[styles.swatch, { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, backgroundColor: color, borderColor: selected ? colors.text : 'transparent' }]}
                >
                  {selected && <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />}
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label={t('editor.type')}>
          <Segmented
            value={draft.type}
            onChange={(next) =>
              patch({
                type: next,
                target: next === 'boolean' ? 1 : next === 'timer' ? 10 : draft.type === 'count' ? draft.target : 8,
                unit: next === 'count' ? draft.unit : undefined,
              })
            }
            options={[
              { value: 'boolean', label: t('editor.typeBoolean') },
              { value: 'count', label: t('editor.typeCount') },
              { value: 'timer', label: t('editor.typeTimer') },
            ]}
          />
        </Field>

        {draft.type !== 'boolean' && (
          <Field
            label={draft.type === 'timer' ? t('editor.minutes') : t('editor.target')}
            error={errors.target ? t('editor.targetRange', { max: targetMax }) : undefined}
          >
            <Stepper
              value={draft.target}
              min={1}
              max={targetMax}
              step={draft.type === 'timer' ? 5 : 1}
              label={t('editor.target')}
              onChange={(target) => patch({ target })}
              decreaseLabel={t('today.decrease')}
              increaseLabel={t('today.increase')}
            />
          </Field>
        )}

        {draft.type === 'count' && (
          <Field label={t('editor.unit')}>
            <TextField
              value={draft.unit ?? ''}
              onChangeText={(unit) => patch({ unit })}
              label={t('editor.unit')}
              placeholder={t('editor.unitPlaceholder')}
              maxLength={16}
            />
          </Field>
        )}

        <Field label={t('editor.schedule')} error={errors.days ? t('editor.pickDays') : undefined}>
          <Segmented
            value={draft.schedule.kind}
            onChange={setSchedule}
            options={[
              { value: 'daily', label: t('editor.scheduleDaily') },
              { value: 'weekdays', label: t('editor.scheduleWeekdays') },
              { value: 'perWeek', label: t('editor.schedulePerWeek') },
            ]}
          />
          {draft.schedule.kind === 'weekdays' && (
            <View style={styles.wrap}>
              {WEEK_ORDER.map((day) => (
                <Chip
                  key={day}
                  label={weekdayName(day)}
                  selected={draft.schedule.kind === 'weekdays' && draft.schedule.days.includes(day)}
                  onPress={() => toggleDay(day)}
                />
              ))}
            </View>
          )}
          {draft.schedule.kind === 'perWeek' && (
            <Stepper
              value={draft.schedule.times}
              min={1}
              max={6}
              label={t('editor.timesPerWeek')}
              format={(v) => t('schedule.perWeek', { count: v })}
              onChange={(times) => patch({ schedule: { kind: 'perWeek', times: times as 1 | 2 | 3 | 4 | 5 | 6 } })}
              decreaseLabel={t('today.decrease')}
              increaseLabel={t('today.increase')}
            />
          )}
        </Field>

        <Field label={t('editor.reminder')}>
          <View style={[styles.row, { minHeight: touchTarget }]}>
            <Text style={[type.body, { color: colors.text, flex: 1 }]}>{t('editor.reminderToggle')}</Text>
            <Switch
              accessibilityLabel={t('editor.reminderToggle')}
              value={draft.reminderTime !== null}
              onValueChange={(on) => patch({ reminderTime: on ? lastReminder.current : null })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          {draft.reminderTime !== null && (
            <TimeStepper value={draft.reminderTime} onChange={(reminderTime) => patch({ reminderTime })} label={t('editor.reminder')} />
          )}
        </Field>

        <Field label={t('editor.category')}>
          <View style={styles.wrap}>
            {categories.map((c) => (
              <Chip key={c.id} label={t(`categories.${c.id}`)} icon={c.icon} selected={draft.category === c.id} onPress={() => patch({ category: c.id })} />
            ))}
          </View>
        </Field>

        <Field label={t('editor.startDate')}>
          <Stepper
            value={-daysBack}
            min={-MAX_DAYS_BACK}
            max={0}
            label={t('editor.startDate')}
            format={() => parseDayKey(draft.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            onChange={(offset) => patch({ createdAt: addDays(today, offset) })}
            decreaseLabel={t('editor.earlier')}
            increaseLabel={t('editor.later')}
          />
        </Field>

        <PrimaryButton label={submitLabel} onPress={submit} disabled={!valid} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  swatch: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
});
