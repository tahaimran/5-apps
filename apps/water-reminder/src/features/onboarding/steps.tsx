import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { ensureNotificationPermission } from '@shared/notify';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useHaptics, useTheme } from '@shared/theme';
import { startAds } from '@/ads/start';
import { Plant } from '@/components/Plant';
import { reminderCount } from '@/domain/schedule';
import { formatClock } from '@/domain/dayKey';
import { defaultCups, DEFAULT_BED_MIN, DEFAULT_GOAL_ML, DEFAULT_WAKE_MIN, defaultReminders } from '@/domain/defaults';
import { GOAL_MAX_ML, GOAL_MIN_ML } from '@/domain/goal';
import type { Activity, Climate, Sex } from '@/domain/types';
import { formatAmount, kgToLb, lbToKg } from '@/domain/units';
import { useWater } from '@/store/water';
import { Chip, MinuteStepper, OptionCard, Segmented, Stepper, TextButton } from '@/ui/controls';
import { applyOnboardingAnswers } from './finish';
import {
  calculatedGoal,
  CUP_SIZES,
  DEFAULT_WEIGHT,
  profileFrom,
  resolveAnswers,
  weightKgOf,
  WEIGHT_RANGE,
  type OnboardingAnswers,
} from './answers';
import { GoalReveal } from './GoalReveal';
import { defaultWeightUnit } from './locale';

const answersOf = (ctx: Pick<StepContext, 'answers'>) => ctx.answers as OnboardingAnswers;
const skipped = (a: Record<string, unknown>) => (a as OnboardingAnswers).skipped === true;
const knowsGoal = (a: Record<string, unknown>) => (a as OnboardingAnswers).knowsGoal === true;
const hiddenWhenSkippedOrKnown = (a: Record<string, unknown>) => skipped(a) || knowsGoal(a);
const ml = (value: number) => `${formatAmount(value, 'ml')} ${t('units.ml')}`;

function AboutStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing } = useTheme();
  const value = ctx.value as Sex | undefined;
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.wrap}>
        {(['female', 'male', 'unspecified'] as const).map((s) => (
          <Chip key={s} label={t(`onboarding.sex.${s}`)} selected={(value ?? 'unspecified') === s} onPress={() => ctx.setValue(s)} />
        ))}
      </View>
      <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.aboutHelper')}</Text>
    </View>
  );
}

function WeightStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing } = useTheme();
  const { unit } = weightKgOf(answersOf(ctx), defaultWeightUnit());
  const current = (ctx.value as { unit: 'kg' | 'lb'; value: number } | undefined) ?? { unit, value: DEFAULT_WEIGHT[unit] };
  const range = WEIGHT_RANGE[current.unit];
  const set = (value: number) => ctx.setValue({ unit: current.unit, value: Math.min(range.max, Math.max(range.min, value)) });
  const switchUnit = (next: 'kg' | 'lb') => {
    if (next === current.unit) return;
    ctx.setValue({ unit: next, value: next === 'lb' ? kgToLb(current.value) : Math.round(lbToKg(current.value)) });
  };
  return (
    <View style={{ gap: spacing.lg }}>
      <Segmented<'kg' | 'lb'>
        value={current.unit}
        onChange={switchUnit}
        options={[
          { value: 'kg', label: t('units.kg') },
          { value: 'lb', label: t('units.lb') },
        ]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <TextButton label={t('onboarding.weightLess5')} onPress={() => set(current.value - 5)} />
        <Stepper
          value={current.value}
          min={range.min}
          max={range.max}
          label={t('onboarding.weightValue')}
          format={(v) => `${v} ${t(`units.${current.unit}`)}`}
          onChange={set}
          decreaseLabel={t('onboarding.weightLess')}
          increaseLabel={t('onboarding.weightMore')}
        />
        <TextButton label={t('onboarding.weightMore5')} onPress={() => set(current.value + 5)} />
      </View>
      <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.weightHelper')}</Text>
    </View>
  );
}

function ScheduleStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing } = useTheme();
  const value = (ctx.value as { wakeMin: number; bedMin: number } | undefined) ?? { wakeMin: DEFAULT_WAKE_MIN, bedMin: DEFAULT_BED_MIN };
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{t('onboarding.wake')}</Text>
        <MinuteStepper label={t('onboarding.wake')} value={value.wakeMin} onChange={(wakeMin) => ctx.setValue({ ...value, wakeMin })} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{t('onboarding.bed')}</Text>
        <MinuteStepper label={t('onboarding.bed')} value={value.bedMin} onChange={(bedMin) => ctx.setValue({ ...value, bedMin })} />
      </View>
      <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.scheduleHelper')}</Text>
    </View>
  );
}

const ACTIVITY_ICONS: Record<Activity, string> = { sedentary: 'sofa-outline', light: 'walk', active: 'run', very_active: 'weight-lifter' };
const CLIMATE_ICONS: Record<Climate, string> = { cool: 'snowflake', mild: 'weather-partly-cloudy', warm: 'weather-sunny', hot: 'thermometer-high' };

function ActivityStep({ ctx }: { ctx: StepContext }) {
  const { spacing } = useTheme();
  const value = ctx.value as Activity | undefined;
  return (
    <View style={{ gap: spacing.sm }}>
      {(['sedentary', 'light', 'active', 'very_active'] as const).map((a) => (
        <OptionCard key={a} icon={ACTIVITY_ICONS[a]} label={t(`onboarding.activity.${a}`)} selected={value === a} onPress={() => ctx.setValue(a)} />
      ))}
    </View>
  );
}

function ClimateStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing } = useTheme();
  const value = ctx.value as Climate | undefined;
  return (
    <View style={{ gap: spacing.sm }}>
      {(['cool', 'mild', 'warm', 'hot'] as const).map((c) => (
        <OptionCard key={c} icon={CLIMATE_ICONS[c]} label={t(`onboarding.climate.${c}`)} selected={value === c} onPress={() => ctx.setValue(c)} />
      ))}
      <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.climateHelper')}</Text>
    </View>
  );
}

function GoalStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing } = useTheme();
  const unit = defaultWeightUnit();
  const answers = answersOf(ctx);
  const calculated = calculatedGoal(answers, unit);
  const value = (ctx.value as { adjustedMl?: number; adjusting?: boolean } | undefined) ?? {};
  const goal = value.adjustedMl ?? calculated;
  return (
    <View style={{ gap: spacing.md }}>
      <Plant stage={0} mood="ok" size={140} />
      <GoalReveal profile={profileFrom(answers, unit)} goalMl={calculated} />
      {value.adjusting && (
        <View style={{ gap: spacing.sm }}>
          <Stepper
            value={goal}
            min={GOAL_MIN_ML}
            max={GOAL_MAX_ML}
            step={50}
            label={t('onboarding.goalStepperLabel')}
            format={ml}
            onChange={(adjustedMl) => ctx.setValue({ adjusting: true, adjustedMl })}
            decreaseLabel={t('onboarding.goalLess')}
            increaseLabel={t('onboarding.goalMore')}
          />
        </View>
      )}
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('onboarding.goalFootnote')}</Text>
    </View>
  );
}

function CupStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing } = useTheme();
  const value = (ctx.value as { ml: number; goalMl?: number } | undefined) ?? { ml: 250 };
  const isCustom = !CUP_SIZES.includes(value.ml as (typeof CUP_SIZES)[number]);
  const [customOpen, setCustomOpen] = useState(isCustom);
  const known = knowsGoal(ctx.answers);
  return (
    <View style={{ gap: spacing.md }}>
      {known && (
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('onboarding.knownGoalTitle')}</Text>
          <Stepper
            value={value.goalMl ?? DEFAULT_GOAL_ML}
            min={GOAL_MIN_ML}
            max={GOAL_MAX_ML}
            step={50}
            label={t('onboarding.goalStepperLabel')}
            format={ml}
            onChange={(goalMl) => ctx.setValue({ ...value, goalMl })}
            decreaseLabel={t('onboarding.goalLess')}
            increaseLabel={t('onboarding.goalMore')}
          />
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('onboarding.knownGoalHelper')}</Text>
        </View>
      )}
      <View style={{ gap: spacing.sm }}>
        {defaultCups.map((c) => (
          <OptionCard
            key={c.id}
            icon={c.icon}
            label={t(`cups.${c.label}`)}
            detail={ml(c.ml)}
            selected={!customOpen && value.ml === c.ml}
            onPress={() => {
              setCustomOpen(false);
              ctx.setValue({ ...value, ml: c.ml });
            }}
          />
        ))}
        <OptionCard icon="tune-variant" label={t('cups.custom')} selected={customOpen} onPress={() => setCustomOpen(true)} />
      </View>
      {customOpen && (
        <Stepper
          value={value.ml}
          min={50}
          max={1000}
          step={50}
          label={t('onboarding.customCup')}
          format={ml}
          onChange={(next) => ctx.setValue({ ...value, ml: next })}
          decreaseLabel={t('onboarding.cupLess')}
          increaseLabel={t('onboarding.cupMore')}
        />
      )}
    </View>
  );
}

function RemindersStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing } = useTheme();
  const value = (ctx.value as OnboardingAnswers['reminders']) ?? { frequency: 'smart', style: 'normal' };
  const set = (patch: Partial<NonNullable<OnboardingAnswers['reminders']>>) => ctx.setValue({ ...value, ...patch });
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.sm }}>
        {(['interval60', 'interval120', 'smart'] as const).map((f) => (
          <OptionCard
            key={f}
            label={t(`onboarding.freq.${f}`)}
            badge={f === 'smart' ? t('onboarding.recommended') : undefined}
            selected={value.frequency === f}
            onPress={() => set({ frequency: f })}
          />
        ))}
      </View>
      <Text style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{t('onboarding.styleHeading')}</Text>
      <View style={{ gap: spacing.sm }}>
        {(['gentle', 'normal'] as const).map((s) => (
          <OptionCard key={s} label={t(`onboarding.style.${s}`)} selected={value.style === s} onPress={() => set({ style: s })} />
        ))}
      </View>
    </View>
  );
}

/** How many reminders the answers produce, for the permission screen's copy. */
export function reminderSummary(a: OnboardingAnswers): { count: number; start: string; end: string } {
  const r = resolveAnswers(a, defaultWeightUnit());
  const settings = { ...defaultReminders, ...r.reminders };
  const cup = r.cups.find((c) => c.id === r.preferredCupId)?.ml ?? 250;
  return { count: reminderCount(settings, r.goal.goalMl, cup), start: formatClock(settings.wakeMin), end: formatClock(settings.bedMin) };
}

function PermissionStep({ ctx }: { ctx: StepContext }) {
  const { colors, radius, spacing, type, touchTarget } = useTheme();
  const { count, start, end } = reminderSummary(answersOf(ctx));
  const cup = resolveAnswers(answersOf(ctx), defaultWeightUnit());
  const cupMl = cup.cups.find((c) => c.id === cup.preferredCupId)?.ml ?? 250;
  const action = { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 };
  return (
    <View style={{ gap: spacing.lg }}>
      <View
        accessible
        accessibilityLabel={t('onboarding.previewLabel')}
        style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }}
      >
        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('onboarding.previewTitle')}</Text>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.previewBody')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, minHeight: touchTarget - 8 }}>
          <Text style={[type.body, action, { color: colors.primary, fontWeight: '700' }]}>{t('onboarding.previewAdd', { amount: ml(cupMl) })}</Text>
          <Text style={[type.body, action, { color: colors.primary, fontWeight: '700' }]}>{t('onboarding.previewSnooze')}</Text>
        </View>
      </View>
      <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('onboarding.permissionTitle')}</Text>
      <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.permissionBody', { count, start, end })}</Text>
    </View>
  );
}

function FirstGlassStep({ ctx }: { ctx: StepContext }) {
  const { colors, type, spacing, radius, touchTarget } = useTheme();
  const haptics = useHaptics();
  const reduced = useReducedMotion();
  const answers = answersOf(ctx);
  const resolved = resolveAnswers(answers, defaultWeightUnit());
  const cupMl = resolved.cups.find((c) => c.id === resolved.preferredCupId)?.ml ?? 250;
  const value = ctx.value as { logged: boolean; ml: number } | undefined;
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced || value?.logged) return;
    scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
  }, [reduced, value?.logged, scale]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const pour = () => {
    if (value?.logged) return;
    // Save the settings first so the drink is measured against this goal and these factors.
    applyOnboardingAnswers(answers);
    useWater.getState().logDrink({ volumeMl: cupMl, source: 'app' });
    haptics.success();
    ctx.setValue({ logged: true, ml: cupMl });
  };

  return (
    <View style={{ gap: spacing.lg, alignItems: 'center' }}>
      <Plant stage={value?.logged ? 1 : 0} mood={value?.logged ? 'happy' : 'ok'} size={170} />
      {value?.logged ? (
        <Text accessibilityLiveRegion="polite" style={[type.title, { color: colors.text, textAlign: 'center', fontWeight: '700' }]}>
          {t('onboarding.firstSip', { drunk: ml(cupMl), left: ml(Math.max(0, resolved.goal.goalMl - cupMl)) })}
        </Text>
      ) : (
        <>
          <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('onboarding.firstGlassTap')}</Text>
          <Animated.View style={pulse}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.pour', { amount: ml(cupMl) })}
              onPress={pour}
              style={{
                minHeight: Math.max(touchTarget, 88),
                minWidth: 168,
                borderRadius: radius.pill,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: spacing.sm,
                paddingHorizontal: spacing.xl,
              }}
            >
              <MaterialCommunityIcons name="cup-water" size={34} color={colors.onPrimary} />
              <Text style={[type.title, { color: colors.onPrimary, fontWeight: '800' }]}>{ml(cupMl)}</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
      {answers.permission === 'denied' && <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('onboarding.deniedNote')}</Text>}
    </View>
  );
}

/**
 * The 11 onboarding steps of DEVELOPMENT_PLAN.md §6. Consent (step 10) is not a screen: it runs
 * right after the permission step through `startAds()`, before the first glass.
 */
export function buildSteps(): OnboardingStep[] {
  const quiet = { hidden: hiddenWhenSkippedOrKnown };
  return [
    {
      key: 'welcome',
      title: t('onboarding.welcomeTitle'),
      body: t('onboarding.welcomeBody'),
      media: (
        <View style={{ alignItems: 'center' }}>
          <Plant stage={0} mood="ok" size={190} />
        </View>
      ),
      cta: t('onboarding.start'),
      secondary: { label: t('onboarding.knowGoal'), onPress: (ctx) => ctx.jumpTo('cup', { knowsGoal: true }) },
      hidden: skipped,
    },
    { key: 'about', title: t('onboarding.aboutTitle'), render: (ctx) => <AboutStep ctx={ctx} />, ...quiet },
    { key: 'weight', title: t('onboarding.weightTitle'), render: (ctx) => <WeightStep ctx={ctx} />, ...quiet },
    { key: 'schedule', title: t('onboarding.scheduleTitle'), render: (ctx) => <ScheduleStep ctx={ctx} />, ...quiet },
    { key: 'activity', title: t('onboarding.activityTitle'), render: (ctx) => <ActivityStep ctx={ctx} />, ...quiet },
    { key: 'climate', title: t('onboarding.climateTitle'), render: (ctx) => <ClimateStep ctx={ctx} />, ...quiet },
    {
      key: 'goal',
      render: (ctx) => <GoalStep ctx={ctx} />,
      cta: t('onboarding.goalSounds'),
      secondary: {
        label: t('onboarding.goalAdjust'),
        onPress: (ctx) => {
          const current = (ctx.value as { adjustedMl?: number } | undefined) ?? {};
          ctx.setValue({ ...current, adjusting: true, adjustedMl: current.adjustedMl ?? calculatedGoal(answersOf(ctx), defaultWeightUnit()) });
        },
      },
      ...quiet,
    },
    {
      key: 'cup',
      title: t('onboarding.cupTitle'),
      render: (ctx) => <CupStep ctx={ctx} />,
      hidden: skipped,
    },
    { key: 'reminders', title: t('onboarding.remindersTitle'), render: (ctx) => <RemindersStep ctx={ctx} />, hidden: skipped },
    {
      key: 'permission',
      render: (ctx) => <PermissionStep ctx={ctx} />,
      cta: t('onboarding.turnOn'),
      skippable: false,
      onContinue: async (ctx) => {
        const granted = await ensureNotificationPermission(null).catch(() => false);
        ctx.setValue(granted ? 'granted' : 'denied');
        await startAds();
      },
      secondary: {
        label: t('onboarding.notNow'),
        onPress: (ctx) => {
          ctx.setValue('skipped');
          void startAds().then(ctx.next);
        },
      },
    },
    { key: 'firstGlass', title: t('onboarding.firstGlassTitle'), render: (ctx) => <FirstGlassStep ctx={ctx} />, cta: t('onboarding.toPlant'), hidden: skipped },
  ];
}

const styles = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
