import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import Check from 'lucide-react-native/icons/check';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card, PressableScale } from '@shared/ui';
import { habitIcons } from '@/data/icons';
import { categories } from '@/domain/categories';
import { addDays, daysBetween, parseDayKey } from '@/domain/dayKey';
import type { DayKey, Schedule, Weekday } from '@/domain/types';
import { countStep } from '@/domain/countStep';
import { COUNT_MAX, NAME_MAX, TIMER_MAX_MINUTES, validateDraft, type HabitDraft } from '@/domain/validate';
import { readableOn } from '@/theme/contrast';
import { habitColors } from '@/theme/tokens';
import { HabitIcon } from '@/ui/icons';
import { Chip, Field, PrimaryButton, Segmented, Stepper, TextField, Toggle } from '@/ui/controls';
import { TimeField } from '@/ui/TimePicker';

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
  const { colors, spacing, radius, type, touchTarget, shadow } = useTheme();
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

        {/* Live preview: the row as it will look on Today. */}
        <Card style={[styles.preview, { gap: spacing.md }]}>
          <View style={[styles.previewTile, { backgroundColor: draft.color, borderRadius: radius.md + 2 }]}>
            <HabitIcon name={draft.icon} size={26} color={readableOn(draft.color)} />
          </View>
          <Text style={[type.title, { color: draft.name ? colors.text : colors.textMuted, fontWeight: '700', flex: 1 }]} numberOfLines={2}>
            {draft.name || t('editor.namePlaceholder')}
          </Text>
        </Card>

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
                <PressableScale
                  key={icon}
                  accessibilityRole="button"
                  accessibilityLabel={t('editor.iconLabel', { name: icon.replace(/-/g, ' ') })}
                  accessibilityState={{ selected }}
                  onPress={() => patch({ icon })}
                  scaleTo={0.88}
                  style={[
                    styles.iconCell,
                    {
                      width: touchTarget + 4,
                      height: touchTarget + 4,
                      borderRadius: radius.md + 2,
                      backgroundColor: selected ? draft.color + '26' : colors.surface,
                      borderColor: selected ? draft.color : 'transparent',
                    },
                    selected ? null : shadow(1),
                  ]}
                >
                  <HabitIcon name={icon} size={24} color={selected ? draft.color : colors.textMuted} />
                </PressableScale>
              );
            })}
          </View>
        </Field>

        <Field label={t('editor.color')}>
          <View style={styles.wrap}>
            {Object.values(habitColors).map((color, i) => {
              const selected = color === draft.color;
              return (
                <PressableScale
                  key={color}
                  accessibilityRole="button"
                  accessibilityLabel={t('editor.colorLabel', { index: i + 1 })}
                  accessibilityState={{ selected }}
                  onPress={() => patch({ color })}
                  scaleTo={0.85}
                  style={[styles.swatch, { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, borderColor: selected ? color : 'transparent' }]}
                >
                  <View style={[styles.swatchFill, { backgroundColor: color }]}>
                    {selected && <Check size={20} color={readableOn(color)} strokeWidth={3} />}
                  </View>
                </PressableScale>
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
              // Big counts move in round chunks (8,000 steps by 500) like the + button on Today.
              step={draft.type === 'timer' ? 5 : countStep(draft.target)}
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
            <Toggle label={t('editor.reminderToggle')} value={draft.reminderTime !== null} onValueChange={(on) => patch({ reminderTime: on ? lastReminder.current : null })} />
          </View>
          {draft.reminderTime !== null && (
            <TimeField value={draft.reminderTime} onChange={(reminderTime) => patch({ reminderTime })} label={t('editor.reminder')} />
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
  iconCell: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  swatch: { alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, padding: 3 },
  swatchFill: { flex: 1, alignSelf: 'stretch', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', alignItems: 'center' },
  previewTile: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
