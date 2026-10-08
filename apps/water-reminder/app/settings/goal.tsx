import { useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { calcGoalMl, clampGoal, GOAL_MAX_ML, GOAL_MIN_ML, glassesOf } from '@/domain/goal';
import type { Activity, Climate, Sex } from '@/domain/types';
import { kgToLb } from '@/domain/units';
import { DEFAULT_WEIGHT } from '@/features/onboarding/answers';
import { WeightInput, type Weight } from '@/features/profile/WeightInput';
import { useSettings } from '@/store/settings';
import { volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { Chip, Field, OptionCard, PrimaryButton, Stepper } from '@/ui/controls';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'active', 'very_active'];
const CLIMATES: Climate[] = ['cool', 'mild', 'warm', 'hot'];

export default function GoalSettings() {
  const { colors, spacing, type } = useTheme();
  const { goal, profile, setGoal, setProfile } = useSettings();
  const unit = goal.unit;
  const [weight, setWeight] = useState<Weight>(() => ({
    unit: profile.weightUnit,
    value: profile.weightUnit === 'kg' ? Math.round(profile.weightKg) : kgToLb(profile.weightKg) || DEFAULT_WEIGHT.lb,
  }));
  const [sex, setSex] = useState<Sex>(profile.sex ?? 'unspecified');
  const [activity, setActivity] = useState<Activity>(profile.activity);
  const [climate, setClimate] = useState<Climate>(profile.climate);

  const weightKg = weight.unit === 'kg' ? weight.value : weight.value / 2.20462;
  const calculated = calcGoalMl({ ...profile, sex, weightKg, weightUnit: weight.unit, activity, climate });

  const useCalculated = () => {
    setProfile({ sex, weightKg: Math.round(weightKg * 10) / 10, weightUnit: weight.unit, activity, climate });
    setGoal({ goalMl: calculated, source: 'calculated' });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.goal'), headerShown: true }} />
      <Field label={t('settings.goalNow')}>
        <Stepper
          value={goal.goalMl}
          min={GOAL_MIN_ML}
          max={GOAL_MAX_ML}
          step={50}
          label={t('onboarding.goalStepperLabel')}
          format={(v) => volume(v, unit)}
          onChange={(goalMl) => setGoal({ goalMl: clampGoal(goalMl), source: 'manual' })}
          decreaseLabel={t('onboarding.goalLess')}
          increaseLabel={t('onboarding.goalMore')}
        />
        <Text style={[type.body, { color: colors.textMuted }]}>
          {t(goal.source === 'manual' ? 'settings.goalManual' : 'settings.goalCalculated')} · {t('onboarding.goalApprox', { count: glassesOf(goal.goalMl) })}
        </Text>
      </Field>

      <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>
        {t('settings.recalc')}
      </Text>
      <Field label={t('onboarding.aboutTitle')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['female', 'male', 'unspecified'] as const).map((s) => (
            <Chip key={s} label={t(`onboarding.sex.${s}`)} selected={sex === s} onPress={() => setSex(s)} />
          ))}
        </View>
      </Field>
      <Field label={t('onboarding.weightTitle')}>
        <WeightInput weight={weight} onChange={setWeight} />
      </Field>
      <Field label={t('onboarding.activityTitle')}>
        <View style={{ gap: spacing.sm }}>
          {ACTIVITIES.map((a) => (
            <OptionCard key={a} label={t(`onboarding.activity.${a}`)} selected={activity === a} onPress={() => setActivity(a)} />
          ))}
        </View>
      </Field>
      <Field label={t('onboarding.climateTitle')}>
        <View style={{ gap: spacing.sm }}>
          {CLIMATES.map((c) => (
            <OptionCard key={c} label={t(`onboarding.climate.${c}`)} selected={climate === c} onPress={() => setClimate(c)} />
          ))}
        </View>
      </Field>

      <Text accessibilityLiveRegion="polite" style={[type.title, { color: colors.text, fontWeight: '800' }]}>
        {t('settings.calculated', { amount: volume(calculated, unit) })}
      </Text>
      <PrimaryButton label={t('settings.useCalculated')} onPress={useCalculated} />
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('onboarding.goalFootnote')}</Text>
    </Screen>
  );
}
