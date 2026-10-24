import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import BellRing from 'lucide-react-native/icons/bell-ring';
import Moon from 'lucide-react-native/icons/moon';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Trash from 'lucide-react-native/icons/trash';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useTimeFormat } from '@shared/time';
import { Card, IconButton, insetTones } from '@shared/ui';
import { formatClock } from '@/domain/dayKey';
import { buildSlots } from '@/domain/schedule';
import type { QuietBlock, ReminderSettings } from '@/domain/types';
import { requestReminderPermission, useNotificationPermission } from '@/notifications/permission';
import { preferredCup, useSettings } from '@/store/settings';
import { extraColorsFor } from '@/theme/tokens';
import { Screen } from '@/ui/Screen';
import { ControlRow, SettingsGroup, SwitchRow } from '@/ui/SettingsRow';
import { Chip, Field, MinuteField, OptionCard, PrimaryButton, Stepper, TextButton } from '@/ui/controls';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const NEW_BLOCK: QuietBlock = { startMin: 12 * 60, endMin: 13 * 60 };
const MAX_BLOCKS = 4;

/** Average gap between reminders, rounded to a friendly label ("2h", "1h 30m"). */
function gapLabel(slots: number[]): string | null {
  if (slots.length < 2) return null;
  const avg = Math.round((slots[slots.length - 1] - slots[0]) / (slots.length - 1) / 15) * 15;
  const h = Math.floor(avg / 60);
  const m = avg % 60;
  return h && m ? t('reminders.gapHM', { h, m }) : h ? t('reminders.gapH', { h }) : t('reminders.gapM', { m });
}

export default function RemindersSettings() {
  const { colors, spacing, radius, type, mode, fonts } = useTheme();
  const clock = useTimeFormat();
  const { reminders, goal, cups, prefs, setReminders } = useSettings();
  const { permission, refresh } = useNotificationPermission();
  const extra = extraColorsFor(mode);
  // The timeline is an inset track with raised pills (lighter than the track in dark mode).
  const { track, raised } = insetTones(colors, mode);

  const cupMl = preferredCup({ cups, prefs }).ml;
  const slots = useMemo(() => buildSlots(reminders, goal.goalMl, cupMl), [reminders, goal.goalMl, cupMl]);
  const set = (patch: Partial<ReminderSettings>) => setReminders(patch);
  const time = (minute: number) => clock.time(formatClock(minute));
  const gap = gapLabel(slots);

  const setBlock = (i: number, patch: Partial<QuietBlock>) =>
    set({ quietBlocks: reminders.quietBlocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const toggleDay = (d: number) => {
    const has = reminders.activeWeekdays.includes(d);
    if (has && reminders.activeWeekdays.length === 1) return; // keep at least one day
    set({ activeWeekdays: has ? reminders.activeWeekdays.filter((x) => x !== d) : [...reminders.activeWeekdays, d].sort() });
  };
  const pill = (text: string) => (
    <View style={[styles.pill, { backgroundColor: raised, borderRadius: radius.pill }]}>
      <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{text}</Text>
    </View>
  );

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('settings.reminders'), headerShown: true }} />
      <SettingsGroup>
        <SwitchRow icon={BellRing} label={t('reminders.enabled')} value={reminders.enabled} onChange={(enabled) => set({ enabled })} />
      </SettingsGroup>

      {reminders.enabled && permission && !permission.granted && (
        <Card style={{ gap: spacing.sm }}>
          <Text style={[type.body, { color: colors.text }]}>{t('today.remindersOffBody')}</Text>
          <PrimaryButton
            label={permission.canAskAgain ? t('today.turnOn') : t('today.openSettings')}
            onPress={() => void requestReminderPermission().then(refresh)}
          />
        </Card>
      )}

      {reminders.enabled && (
        <>
          {/* The day at a glance: first — every ~2h — last (the timeline from the design references). */}
          <View style={{ backgroundColor: track, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
            {slots.length > 0 ? (
              <View style={styles.timelineRow} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                {pill(time(slots[0]))}
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                {gap && pill(gap)}
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                {pill(time(slots[slots.length - 1]))}
              </View>
            ) : null}
            {/* The pills above already show first and last, so the visible line is short; TalkBack hears it all. */}
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={slots.length > 0 ? t('reminders.summary', { count: slots.length, first: time(slots[0]), last: time(slots[slots.length - 1]) }) : t('reminders.none')}
              style={[type.body, { color: colors.text, fontWeight: '600', textAlign: 'center' }]}
            >
              {slots.length > 0 ? t('reminders.count', { count: slots.length }) : t('reminders.none')}
            </Text>
            {slots.length > 0 && (
              <View style={styles.wrap}>
                {slots.map((s) => (
                  <View key={s} style={[styles.slot, { backgroundColor: raised, borderRadius: radius.pill }]}>
                    <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700', fontFamily: fonts.body }]}>{time(s)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <SettingsGroup title={t('reminders.window')}>
            <ControlRow label={t('settings.wake')} icon={Sunrise} tint={colors.accent} bg={extra.sunSoft}>
              <MinuteField label={t('settings.wake')} value={reminders.wakeMin} onChange={(wakeMin) => set({ wakeMin })} />
            </ControlRow>
            <ControlRow label={t('settings.bed')} icon={Moon}>
              <MinuteField label={t('settings.bed')} value={reminders.bedMin} onChange={(bedMin) => set({ bedMin })} />
            </ControlRow>
          </SettingsGroup>

          <Field label={t('onboarding.remindersTitle')}>
            <View style={{ gap: spacing.sm }}>
              <OptionCard label={t('onboarding.freq.smart')} selected={reminders.frequency === 'smart'} onPress={() => set({ frequency: 'smart' })} badge={t('onboarding.recommended')} />
              <OptionCard label={t('reminders.fixedInterval')} selected={reminders.frequency === 'interval'} onPress={() => set({ frequency: 'interval' })} />
            </View>
            {reminders.frequency === 'interval' && (
              <View style={styles.wrap}>
                {([60, 90, 120, 180] as const).map((m) => (
                  <Chip key={m} label={t('reminders.every', { minutes: m })} selected={reminders.intervalMin === m} onPress={() => set({ intervalMin: m })} />
                ))}
              </View>
            )}
          </Field>

          <Field label={t('onboarding.styleHeading')} hint={t('reminders.styleHint')}>
            <View style={{ gap: spacing.sm }}>
              {(['gentle', 'normal'] as const).map((s) => (
                <OptionCard key={s} label={t(`onboarding.style.${s}`)} selected={reminders.style === s} onPress={() => set({ style: s })} />
              ))}
            </View>
          </Field>

          <Field label={t('reminders.snooze')}>
            <View style={styles.wrap}>
              {([10, 15, 30] as const).map((m) => (
                <Chip key={m} label={t('reminders.minutes', { minutes: m })} selected={reminders.snoozeMin === m} onPress={() => set({ snoozeMin: m })} />
              ))}
            </View>
          </Field>

          <Field label={t('reminders.skipWindow')} hint={t('reminders.skipHint')}>
            <Stepper
              value={reminders.skipWindowMin}
              min={10}
              max={60}
              step={5}
              label={t('reminders.skipWindow')}
              format={(v) => t('reminders.minutes', { minutes: v })}
              onChange={(skipWindowMin) => set({ skipWindowMin })}
              decreaseLabel={t('reminders.skipLess')}
              increaseLabel={t('reminders.skipMore')}
            />
          </Field>

          <Field label={t('reminders.days')}>
            <View style={styles.wrap}>
              {WEEKDAYS.map((d) => (
                <Chip key={d} label={t(`reminders.weekday.${d}`)} selected={reminders.activeWeekdays.includes(d)} onPress={() => toggleDay(d)} />
              ))}
            </View>
          </Field>

          <Field label={t('reminders.quiet')} hint={t('reminders.quietHint')}>
            {reminders.quietBlocks.map((b, i) => (
              <Card key={i} style={{ gap: spacing.sm }}>
                <View style={styles.quietHead}>
                  <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{t('reminders.quietRange', { from: time(b.startMin), to: time(b.endMin) })}</Text>
                  <IconButton
                    icon={Trash}
                    color={colors.danger}
                    label={t('reminders.removeQuiet', { from: time(b.startMin), to: time(b.endMin) })}
                    onPress={() => set({ quietBlocks: reminders.quietBlocks.filter((_, j) => j !== i) })}
                  />
                </View>
                <View style={[styles.wrap, { alignItems: 'center' }]}>
                  <MinuteField label={t('reminders.quietFrom')} value={b.startMin} onChange={(startMin) => setBlock(i, { startMin })} />
                  <Text style={[type.body, { color: colors.textMuted }]}>–</Text>
                  <MinuteField label={t('reminders.quietTo')} value={b.endMin} onChange={(endMin) => setBlock(i, { endMin })} />
                </View>
              </Card>
            ))}
            {reminders.quietBlocks.length < MAX_BLOCKS && <TextButton label={t('reminders.addQuiet')} onPress={() => set({ quietBlocks: [...reminders.quietBlocks, NEW_BLOCK] })} />}
          </Field>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pill: { paddingHorizontal: 12, paddingVertical: 6 },
  line: { flex: 1, height: 2, marginHorizontal: 4, maxWidth: 40 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { paddingHorizontal: 10, paddingVertical: 4 },
  quietHead: { flexDirection: 'row', alignItems: 'center' },
});
