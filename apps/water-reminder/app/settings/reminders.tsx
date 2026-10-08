import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { formatClock } from '@/domain/dayKey';
import { buildSlots } from '@/domain/schedule';
import type { QuietBlock, ReminderSettings } from '@/domain/types';
import { requestReminderPermission, useNotificationPermission } from '@/notifications/permission';
import { preferredCup, useSettings } from '@/store/settings';
import { Screen } from '@/ui/Screen';
import { SwitchRow } from '@/ui/SettingsRow';
import { Chip, Field, MinuteStepper, OptionCard, PrimaryButton, Stepper, TextButton } from '@/ui/controls';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const NEW_BLOCK: QuietBlock = { startMin: 12 * 60, endMin: 13 * 60 };
const MAX_BLOCKS = 4;

export default function RemindersSettings() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const { reminders, goal, cups, prefs, setReminders } = useSettings();
  const { permission, refresh } = useNotificationPermission();

  const cupMl = preferredCup({ cups, prefs }).ml;
  const slots = useMemo(() => buildSlots(reminders, goal.goalMl, cupMl), [reminders, goal.goalMl, cupMl]);
  const set = (patch: Partial<ReminderSettings>) => setReminders(patch);

  const setBlock = (i: number, patch: Partial<QuietBlock>) =>
    set({ quietBlocks: reminders.quietBlocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const toggleDay = (d: number) => {
    const has = reminders.activeWeekdays.includes(d);
    if (has && reminders.activeWeekdays.length === 1) return; // keep at least one day
    set({ activeWeekdays: has ? reminders.activeWeekdays.filter((x) => x !== d) : [...reminders.activeWeekdays, d].sort() });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.reminders'), headerShown: true }} />
      <SwitchRow label={t('reminders.enabled')} value={reminders.enabled} onChange={(enabled) => set({ enabled })} />

      {reminders.enabled && permission && !permission.granted && (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }}>
          <Text style={[type.body, { color: colors.text }]}>{t('today.remindersOffBody')}</Text>
          <PrimaryButton
            label={permission.canAskAgain ? t('today.turnOn') : t('today.openSettings')}
            onPress={() => void requestReminderPermission().then(refresh)}
          />
        </View>
      )}

      {reminders.enabled && (
        <>
          <Text accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {slots.length > 0
              ? t('reminders.summary', { count: slots.length, first: formatClock(slots[0]), last: formatClock(slots[slots.length - 1]) })
              : t('reminders.none')}
          </Text>

          <Field label={t('onboarding.remindersTitle')}>
            <View style={{ gap: spacing.sm }}>
              <OptionCard label={t('onboarding.freq.smart')} selected={reminders.frequency === 'smart'} onPress={() => set({ frequency: 'smart' })} badge={t('onboarding.recommended')} />
              <OptionCard label={t('reminders.fixedInterval')} selected={reminders.frequency === 'interval'} onPress={() => set({ frequency: 'interval' })} />
            </View>
            {reminders.frequency === 'interval' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {([60, 90, 120, 180] as const).map((m) => (
                  <Chip key={m} label={t('reminders.every', { minutes: m })} selected={reminders.intervalMin === m} onPress={() => set({ intervalMin: m })} />
                ))}
              </View>
            )}
          </Field>

          <Field label={t('onboarding.styleHeading')}>
            <View style={{ gap: spacing.sm }}>
              {(['gentle', 'normal'] as const).map((s) => (
                <OptionCard key={s} label={t(`onboarding.style.${s}`)} selected={reminders.style === s} onPress={() => set({ style: s })} />
              ))}
            </View>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('reminders.styleHint')}</Text>
          </Field>

          <Field label={t('reminders.snooze')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {([10, 15, 30] as const).map((m) => (
                <Chip key={m} label={t('reminders.minutes', { minutes: m })} selected={reminders.snoozeMin === m} onPress={() => set({ snoozeMin: m })} />
              ))}
            </View>
          </Field>

          <Field label={t('reminders.skipWindow')}>
            <Stepper
              value={reminders.skipWindowMin}
              min={10}
              max={60}
              step={5}
              label={t('reminders.skipWindow')}
              format={(v) => t('reminders.minutes', { minutes: v })}
              onChange={(skipWindowMin) => set({ skipWindowMin })}
              decreaseLabel={t('common.earlier')}
              increaseLabel={t('common.later')}
            />
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('reminders.skipHint')}</Text>
          </Field>

          <Field label={t('reminders.days')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {WEEKDAYS.map((d) => (
                <Chip key={d} label={t(`reminders.weekday.${d}`)} selected={reminders.activeWeekdays.includes(d)} onPress={() => toggleDay(d)} />
              ))}
            </View>
          </Field>

          <Field label={t('reminders.quiet')}>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('reminders.quietHint')}</Text>
            {reminders.quietBlocks.map((b, i) => (
              <View key={i} style={{ gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md }}>
                <MinuteStepper label={t('reminders.quietFrom')} value={b.startMin} onChange={(startMin) => setBlock(i, { startMin })} />
                <MinuteStepper label={t('reminders.quietTo')} value={b.endMin} onChange={(endMin) => setBlock(i, { endMin })} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('reminders.removeQuiet', { from: formatClock(b.startMin), to: formatClock(b.endMin) })}
                  onPress={() => set({ quietBlocks: reminders.quietBlocks.filter((_, j) => j !== i) })}
                  style={{ minHeight: touchTarget, justifyContent: 'center' }}
                >
                  <Text style={[type.body, { color: colors.danger, fontWeight: '600' }]}>{t('reminders.remove')}</Text>
                </Pressable>
              </View>
            ))}
            {reminders.quietBlocks.length < MAX_BLOCKS && <TextButton label={t('reminders.addQuiet')} onPress={() => set({ quietBlocks: [...reminders.quietBlocks, NEW_BLOCK] })} />}
          </Field>
        </>
      )}
    </Screen>
  );
}
