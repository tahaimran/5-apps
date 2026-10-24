import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { IconButton, Stepper } from '@shared/ui';
import type { Unit } from '@/domain/types';
import { clamp, drinkStep, goalStep, unitToMl, volumeIn } from '@/domain/units';
import { TextField } from './controls';
import { volume } from './format';

/** Typed text in the user's unit → ml, or null when it is not a positive number. */
export const parseAmount = (text: string, unit: Unit): number | null => {
  const n = Number(text.replace(',', '.').trim());
  if (!text.trim() || !Number.isFinite(n) || n <= 0) return null;
  return unitToMl(n, unit);
};

export interface AmountStepperProps {
  /** Always ml; shown and stepped in `unit`. */
  valueMl: number;
  onChange: (ml: number) => void;
  unit: Unit;
  minMl: number;
  maxMl: number;
  /** 'drink': fine steps for sips, bigger for bottles. 'goal': 50 ml / 2 fl oz. */
  kind: 'drink' | 'goal';
  label: string;
  decreaseLabel?: string;
  increaseLabel?: string;
  /** The amount is the screen's main number: big value, bigger buttons. */
  large?: boolean;
}

/**
 * − amount + in the user's unit, snapping to sensible steps; tapping the amount lets the user type an
 * exact number instead (330 ml can, 12 fl oz bottle).
 */
export function AmountStepper({ valueMl, onChange, unit, minMl, maxMl, kind, label, decreaseLabel, increaseLabel, large }: AmountStepperProps) {
  const { spacing } = useTheme();
  const [typing, setTyping] = useState<string | null>(null);
  const toUnit = (ml: number) => volumeIn(ml, unit);

  if (typing !== null) {
    const parsed = parseAmount(typing, unit);
    const commit = () => {
      if (parsed !== null) onChange(clamp(parsed, minMl, maxMl));
      setTyping(null);
    };
    return (
      <View style={[styles.row, { gap: spacing.sm }]}>
        <View style={styles.flex}>
          <TextField
            value={typing}
            onChangeText={(v) => setTyping(v.replace(/[^\d.,]/g, '').slice(0, 6))}
            label={t('amount.typeLabel', { label, unit: t(`units.${unit}`) })}
            keyboardType="decimal-pad"
            autoFocus
            invalid={typing.trim() !== '' && parsed === null}
            onSubmitEditing={commit}
          />
        </View>
        <IconButton icon={Check} variant="solid" label={t('amount.done')} onPress={commit} />
      </View>
    );
  }

  return (
    <Stepper
      value={toUnit(valueMl)}
      min={toUnit(minMl)}
      max={toUnit(maxMl)}
      step={kind === 'goal' ? goalStep(unit) : (v, d) => drinkStep(unit, v, d)}
      label={label}
      format={(v) => volume(unitToMl(v, unit), unit)}
      onChange={(v) => onChange(clamp(unitToMl(v, unit), minMl, maxMl))}
      decreaseLabel={decreaseLabel}
      increaseLabel={increaseLabel}
      onPressValue={() => setTyping(String(toUnit(valueMl)))}
      valueHint={t('amount.typeHint')}
      large={large}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
