import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Baby from 'lucide-react-native/icons/baby';
import CalendarHeart from 'lucide-react-native/icons/calendar-heart';
import Footprints from 'lucide-react-native/icons/footprints';
import HeartHandshake from 'lucide-react-native/icons/heart-handshake';
import Moon from 'lucide-react-native/icons/moon';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Timer from 'lucide-react-native/icons/timer';
import Users from 'lucide-react-native/icons/users';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { fromHHMM, TimeField, toHHMM } from '@shared/time';
import type { IconComponent } from '@shared/ui';
import { defaultDraft, draftSavable, DueDateForm, type DueDraft } from '@/components/DueDateForm';
import type { FirstBaby, Need } from '@/domain/types';
import { changeKickReminderTime, disableKickReminder, enableKickReminder, type EnableResult } from '@/notifications/kickReminder';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { currentDateKey } from '@/store/today';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { timeOfDay, useClock24h } from '@/ui/format';
import { OptionCard } from '@/ui/OptionCard';
import { SettingsGroup, SwitchRow } from '@/ui/SettingsRow';
import type { OnboardingAnswers } from './answers';

function Welcome() {
  const { radius } = useTheme();
  const app = useAppColors();
  // A soft moon over a curved horizon (plan §6 screen 1), on the app's dawn wash. Decoration only.
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.welcomeWrap}>
      <View style={[styles.welcome, { borderRadius: radius.xl }]}>
        <LinearGradient colors={app.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.moon}>
          <Moon size={64} color={app.heroRing} strokeWidth={1.75} fill={app.heroTrack} />
        </View>
        <View style={[styles.spark, { left: 48, top: 30 }]}>
          <Sparkles size={22} color={app.heroRing} strokeWidth={2} />
        </View>
        <View style={[styles.horizon, { backgroundColor: app.heroTrack }]} />
      </View>
    </View>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <OptionCard kind="checkbox" label={label} selected={checked} onPress={() => onChange(!checked)} />;
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

const FIRST: { value: FirstBaby; key: string; icon: IconComponent }[] = [
  { value: 'yes', key: 'onboarding.firstYes', icon: Baby },
  { value: 'no', key: 'onboarding.firstNo', icon: HeartHandshake },
  { value: 'partner', key: 'onboarding.firstPartner', icon: Users },
];

function FirstTime({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const value = ctx.value as FirstBaby | undefined;
  return (
    <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
      {FIRST.map((o) => (
        <OptionCard key={o.value} icon={o.icon} label={t(o.key)} selected={value === o.value} onPress={() => ctx.setValue(o.value)} />
      ))}
      <AppText style={[type.body, { color: colors.textMuted, marginTop: spacing.sm }]}>{t('onboarding.firstFooter')}</AppText>
    </View>
  );
}

const NEEDS: { value: Need; key: string; icon: IconComponent }[] = [
  { value: 'timer', key: 'onboarding.needTimer', icon: Timer },
  { value: 'kicks', key: 'onboarding.needKicks', icon: Footprints },
  { value: 'tracking', key: 'onboarding.needTracking', icon: CalendarHeart },
];

function Needs({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const clock24h = useClock24h();
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
          <OptionCard key={n.value} kind="checkbox" icon={n.icon} label={t(n.key)} selected={value.needs.includes(n.value)} onPress={() => toggle(n.value)} />
        ))}
      </View>
      {value.needs.includes('kicks') ? (
        <View style={{ gap: spacing.sm }}>
          <SettingsGroup>
            <SwitchRow label={t('onboarding.remindMe', { time: timeOfDay(value.reminder.hour, value.reminder.minute, clock24h) })} value={value.reminder.on} onChange={(on) => void remind(on)} />
          </SettingsGroup>
          {value.reminder.on ? (
            <View style={styles.end}>
              <TimeField
                label={t('reminder.time')}
                value={toHHMM(value.reminder.hour, value.reminder.minute)}
                onChange={(hhmm) => {
                  const { hour, minute } = fromHHMM(hhmm);
                  set({ reminder: { on: true, hour, minute } });
                  void changeKickReminderTime(hour, minute);
                }}
              />
            </View>
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

const styles = StyleSheet.create({
  welcomeWrap: { alignItems: 'center', paddingVertical: 16 },
  welcome: { width: 240, height: 168, overflow: 'hidden', alignItems: 'center' },
  moon: { marginTop: 26 },
  spark: { position: 'absolute' },
  horizon: { position: 'absolute', bottom: -96, width: 380, height: 168, borderRadius: 190 },
  end: { alignItems: 'flex-end' },
});
