import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { TimeStepper } from '@/components/TimeStepper';
import { defaultDraft, draftSavable, DueDateForm, type DueDraft } from '@/components/DueDateForm';
import type { FirstBaby, Need } from '@/domain/types';
import { changeKickReminderTime, disableKickReminder, enableKickReminder, type EnableResult } from '@/notifications/kickReminder';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { currentDateKey } from '@/store/today';
import { AppText } from '@/ui/AppText';
import { timeOfDay } from '@/ui/format';
import { OptionCard } from '@/ui/OptionCard';
import { SwitchRow } from '@/ui/SwitchRow';
import type { OnboardingAnswers } from './answers';

function Welcome() {
  const { colors } = useTheme();
  // A soft moon over a curved horizon (plan §6 screen 1). Decoration only.
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 220, height: 160, borderRadius: 24, backgroundColor: colors.surfaceAlt, overflow: 'hidden', alignItems: 'center', borderWidth: 2, borderColor: colors.border }}>
        <View style={{ marginTop: 22 }}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={72} color={colors.text} />
        </View>
        <View style={{ position: 'absolute', bottom: -90, width: 360, height: 160, borderRadius: 180, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border }} />
      </View>
    </View>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const { colors, spacing, radius, type } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: checked ? 3 : 1, borderColor: checked ? colors.text : colors.border, backgroundColor: colors.surface }}
    >
      <MaterialCommunityIcons accessible={false} name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'} size={32} color={colors.text} />
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{label}</AppText>
    </Pressable>
  );
}

function HowFar({ ctx }: { ctx: StepContext }) {
  const stored = ctx.value as OnboardingAnswers['howFar'];
  const draft = stored && stored !== 'later' ? stored : null;
  // Nothing is chosen until the person picks how they know: the form starts empty, not on a made-up date.
  const [picked, setPicked] = useState(draft !== null);
  const today = currentDateKey();
  const current: DueDraft = draft ?? defaultDraft('edd', today);
  const { colors, type } = useTheme();
  if (!picked) {
    return (
      <View style={{ gap: 8 }}>
        <DueDateChooser onPick={(mode) => { setPicked(true); ctx.setValue({ ...defaultDraft(mode, today) }); }} />
        <AppText style={[type.body, { color: colors.textMuted }]}>{t('due.setDateHint')}</AppText>
      </View>
    );
  }
  return <DueDateForm grouped draft={current} today={today} onChange={(d) => ctx.setValue(d)} />;
}

function DueDateChooser({ onPick }: { onPick: (mode: 'edd' | 'lmp' | 'conception') => void }) {
  return (
    <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
      <OptionCard label={t('due.modeEdd')} selected={false} onPress={() => onPick('edd')} />
      <OptionCard label={t('due.modeLmp')} selected={false} onPress={() => onPick('lmp')} />
      <OptionCard label={t('due.modeConceptionOrIvf')} selected={false} onPress={() => onPick('conception')} />
    </View>
  );
}

const FIRST: { value: FirstBaby; key: string }[] = [
  { value: 'yes', key: 'onboarding.firstYes' },
  { value: 'no', key: 'onboarding.firstNo' },
  { value: 'partner', key: 'onboarding.firstPartner' },
];

function FirstTime({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const value = ctx.value as FirstBaby | undefined;
  return (
    <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
      {FIRST.map((o) => (
        <OptionCard key={o.value} label={t(o.key)} selected={value === o.value} onPress={() => ctx.setValue(o.value)} />
      ))}
      <AppText style={[type.body, { color: colors.textMuted, marginTop: spacing.sm }]}>{t('onboarding.firstFooter')}</AppText>
    </View>
  );
}

const NEEDS: { value: Need; key: string }[] = [
  { value: 'timer', key: 'onboarding.needTimer' },
  { value: 'kicks', key: 'onboarding.needKicks' },
  { value: 'tracking', key: 'onboarding.needTracking' },
];

function Needs({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const clock24h = useSettings((s) => s.settings.clock24h);
  const saved = useSettings((s) => s.settings.kickReminder);
  const value = (ctx.value as OnboardingAnswers['needs']) ?? { needs: [], reminder: { on: false, hour: saved.hour, minute: saved.minute } };
  const [message, setMessage] = useState<EnableResult | null>(null);
  const set = (patch: Partial<NonNullable<OnboardingAnswers['needs']>>) => ctx.setValue({ ...value, ...patch });
  const toggle = (need: Need) => {
    const needs = value.needs.includes(need) ? value.needs.filter((n) => n !== need) : [...value.needs, need];
    // Taking "Counting kicks" away takes the reminder with it.
    if (need === 'kicks' && !needs.includes('kicks') && value.reminder.on) void disableKickReminder();
    set({ needs, reminder: need === 'kicks' && !needs.includes('kicks') ? { ...value.reminder, on: false } : value.reminder });
    if (need === 'kicks') setMessage(null);
  };
  const remind = async (on: boolean) => {
    if (!on) {
      void disableKickReminder();
      set({ reminder: { ...value.reminder, on: false } });
      return;
    }
    // The only moment the phone's permission is asked for in onboarding: when this switch is turned on.
    const result = await enableKickReminder(value.reminder.hour, value.reminder.minute);
    setMessage(result === 'enabled' ? null : result);
    set({ reminder: { ...value.reminder, on: result === 'enabled' } });
  };
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        {NEEDS.map((n) => (
          <OptionCard key={n.value} label={t(n.key)} selected={value.needs.includes(n.value)} onPress={() => toggle(n.value)} />
        ))}
      </View>
      {value.needs.includes('kicks') ? (
        <View style={{ gap: spacing.sm }}>
          <SwitchRow label={t('onboarding.remindMe', { time: timeOfDay(value.reminder.hour, value.reminder.minute, clock24h) })} value={value.reminder.on} onChange={(on) => void remind(on)} />
          {value.reminder.on ? (
            <TimeStepper
              hour={value.reminder.hour}
              minute={value.reminder.minute}
              onChange={(hour, minute) => {
                set({ reminder: { on: true, hour, minute } });
                void changeKickReminderTime(hour, minute);
              }}
            />
          ) : null}
          {message ? <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t(message === 'blocked' ? 'onboarding.remindBlocked' : 'onboarding.remindDenied')}</AppText> : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The five screens of DEVELOPMENT_PLAN.md §6, with the plan's words. Skip (top right) applies safe defaults and goes
 * to the Timer; the last screen has its own "Skip" under the button because the shared flow shows no header Skip there.
 * The consent form is not a step: `app/onboarding.tsx` runs it after the last screen.
 */
export function buildSteps(onSkipLast: (ctx: StepContext) => void): OnboardingStep[] {
  return [
    { key: 'welcome', title: t('onboarding.welcomeTitle'), body: t('onboarding.welcomeBody'), media: <Welcome />, cta: t('onboarding.getStarted') },
    {
      key: 'disclaimer',
      title: t('onboarding.disclaimerTitle'),
      body: t('onboarding.disclaimerBody'),
      render: (ctx) => <Checkbox label={t('onboarding.understand')} checked={ctx.value === true} onChange={(v) => ctx.setValue(v)} />,
      canContinue: ({ value }) => value === true,
      cta: t('onboarding.continue'),
    },
    {
      key: 'howFar',
      title: t('onboarding.howFarTitle'),
      render: (ctx) => <HowFar ctx={ctx} />,
      canContinue: ({ value }) => !!value && value !== 'later' && draftSavable(value as DueDraft, currentDateKey()),
      cta: t('onboarding.continue'),
      secondary: { label: t('onboarding.later'), onPress: (ctx) => { ctx.setValue('later'); ctx.next(); } },
    },
    { key: 'firstBaby', title: t('onboarding.firstTitle'), render: (ctx) => <FirstTime ctx={ctx} />, cta: t('onboarding.continue') },
    {
      key: 'needs',
      title: t('onboarding.needsTitle'),
      render: (ctx) => <Needs ctx={ctx} />,
      cta: t('onboarding.allSet'),
      secondary: { label: t('onboarding.skip'), onPress: onSkipLast },
    },
  ];
}

export const markCoachMarkShown = () => useMeta.getState().update({ coachMarkShownAt: Date.now() });
