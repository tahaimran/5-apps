import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { calcGoalMl, clampGoalIn, GOAL_MAX_ML, GOAL_MIN_ML, glassesOf } from '@/domain/goal';
import type { Activity, Climate, Sex } from '@/domain/types';
import { kgToLb } from '@/domain/units';
import { DEFAULT_WEIGHT } from '@/features/onboarding/answers';
import { WeightInput, type Weight } from '@/features/profile/WeightInput';
import { useSettings } from '@/store/settings';
import { AmountStepper } from '@/ui/AmountStepper';
import { volume } from '@/ui/format';
import { activityIcons, climateIcons } from '@/ui/icons';
import { Screen } from '@/ui/Screen';
import { Chip, Field, OptionCard, PrimaryButton } from '@/ui/controls';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'active', 'very_active'];
const CLIMATES: Climate[] = ['cool', 'mild', 'warm', 'hot'];

export default function GoalSettings() {
  const { colors, spacing, type, fonts } = useTheme();
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
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t('settings.goal'), headerShown: true }} />
      <Card style={{ gap: spacing.md }}>
        <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t('settings.goalNow')}</Text>
        <Text style={[styles.big, { color: colors.text, fontFamily: fonts.display }]} accessibilityElementsHidden importantForAccessibility="no">
          {volume(goal.goalMl, unit)}
        </Text>
        <AmountStepper
          valueMl={goal.goalMl}
          onChange={(ml) => setGoal({ goalMl: clampGoalIn(ml, unit), source: 'manual' })}
          unit={unit}
          minMl={GOAL_MIN_ML}
          maxMl={GOAL_MAX_ML}
          kind="goal"
          label={t('onboarding.goalStepperLabel')}
          decreaseLabel={t('onboarding.goalLess')}
          increaseLabel={t('onboarding.goalMore')}
        />
        <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
          {t(goal.source === 'manual' ? 'settings.goalManual' : 'settings.goalCalculated')} · {t('onboarding.goalApprox', { count: glassesOf(goal.goalMl) })}
        </Text>
      </Card>

      <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', marginTop: spacing.sm }]}>
        {t('settings.recalc')}
      </Text>
      <Field label={t('onboarding.aboutTitle')}>
        <View style={styles.wrap}>
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
            <OptionCard key={a} icon={activityIcons[a]} label={t(`onboarding.activity.${a}`)} selected={activity === a} onPress={() => setActivity(a)} />
          ))}
        </View>
      </Field>
      <Field label={t('onboarding.climateTitle')}>
        <View style={{ gap: spacing.sm }}>
          {CLIMATES.map((c) => (
            <OptionCard key={c} icon={climateIcons[c]} label={t(`onboarding.climate.${c}`)} selected={climate === c} onPress={() => setClimate(c)} />
          ))}
        </View>
      </Field>

      <Card style={{ gap: spacing.md, backgroundColor: colors.primarySoft }}>
        <Text accessibilityLiveRegion="polite" style={[type.title, { color: colors.text, fontWeight: '800', textAlign: 'center' }]}>
          {t('settings.calculated', { amount: volume(calculated, unit) })}
        </Text>
        <PrimaryButton label={t('settings.useCalculated')} onPress={useCalculated} />
      </Card>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('onboarding.goalFootnote')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  big: { fontSize: 40, lineHeight: 46, fontWeight: '800', textAlign: 'center' },
});
