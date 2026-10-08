import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { kgToLb, lbToKg } from '@/domain/units';
import { WEIGHT_RANGE } from '@/features/onboarding/answers';
import { Segmented, Stepper, TextButton } from '@/ui/controls';

export interface Weight {
  unit: 'kg' | 'lb';
  value: number;
}

/** Unit toggle, +/-1 stepper and +/-5 shortcuts (a wheel would be 100+ taps to cross a range). */
export function WeightInput({ weight, onChange }: { weight: Weight; onChange: (w: Weight) => void }) {
  const { spacing } = useTheme();
  const range = WEIGHT_RANGE[weight.unit];
  const set = (value: number) => onChange({ unit: weight.unit, value: Math.min(range.max, Math.max(range.min, value)) });
  const switchUnit = (unit: 'kg' | 'lb') => {
    if (unit === weight.unit) return;
    onChange({ unit, value: unit === 'lb' ? kgToLb(weight.value) : Math.round(lbToKg(weight.value)) });
  };
  return (
    <View style={{ gap: spacing.lg }}>
      <Segmented<'kg' | 'lb'>
        value={weight.unit}
        onChange={switchUnit}
        options={[
          { value: 'kg', label: t('units.kg') },
          { value: 'lb', label: t('units.lb') },
        ]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <TextButton label={t('onboarding.weightLess5')} onPress={() => set(weight.value - 5)} />
        <Stepper
          value={weight.value}
          min={range.min}
          max={range.max}
          label={t('onboarding.weightValue')}
          format={(v) => `${v} ${t(`units.${weight.unit}`)}`}
          onChange={set}
          decreaseLabel={t('onboarding.weightLess')}
          increaseLabel={t('onboarding.weightMore')}
        />
        <TextButton label={t('onboarding.weightMore5')} onPress={() => set(weight.value + 5)} />
      </View>
    </View>
  );
}
