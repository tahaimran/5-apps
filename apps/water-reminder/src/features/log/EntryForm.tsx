import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Clock from 'lucide-react-native/icons/clock';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card, PressableScale } from '@shared/ui';
import { effectiveMl, factorOf } from '@/domain/hydration';
import type { BeverageId } from '@/domain/types';
import { useSettings } from '@/store/settings';
import { AmountStepper } from '@/ui/AmountStepper';
import { volume } from '@/ui/format';
import { beverageIcons } from '@/ui/icons';
import { ControlRow, IconCircle, SettingsGroup } from '@/ui/SettingsRow';
import { Chip, Field, MinuteField, PrimaryButton } from '@/ui/controls';

export { parseAmount } from '@/ui/AmountStepper';

export const AMOUNT_MIN = 10;
export const AMOUNT_MAX = 2000;
export const DRINKS: BeverageId[] = ['water', 'sparkling', 'tea', 'coffee', 'juice', 'milk'];

export interface EntryValues {
  beverage: BeverageId;
  volumeMl: number;
  /** Minutes from midnight of the entry's calendar day. */
  minute: number;
}

/**
 * Drink picker, amount (stepper with sensible steps, or typed exactly), time and a submit button:
 * the form behind both "Add a drink" and "Edit drink" (plan §5.4).
 */
export function EntryForm({
  initial,
  submitLabel,
  onSubmit,
  footer,
}: {
  initial: EntryValues;
  submitLabel: string;
  onSubmit: (values: EntryValues) => void;
  footer?: ReactNode;
}) {
  const { colors, spacing, radius, type, fonts } = useTheme();
  const unit = useSettings((s) => s.goal.unit);
  const beverages = useSettings((s) => s.beverages);
  const cups = useSettings((s) => s.cups);
  const [beverage, setBeverage] = useState<BeverageId>(initial.beverage);
  const [amount, setAmount] = useState(initial.volumeMl);
  const [minute, setMinute] = useState(initial.minute);

  const factor = factorOf(beverages, beverage);
  const counted = effectiveMl(amount, factor);
  const presets = [...new Set(cups.map((c) => c.ml))].sort((a, b) => a - b).slice(0, 4);

  return (
    <>
      <Field label={t('logCustom.beverage')}>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {DRINKS.map((id) => {
            const selected = id === beverage;
            return (
              <PressableScale
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`beverages.${id}`)}
                onPress={() => setBeverage(id)}
                scaleTo={0.95}
                style={[
                  styles.drink,
                  {
                    borderRadius: radius.lg,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primarySoft : colors.surface,
                  },
                ]}
              >
                <IconCircle icon={beverageIcons[id]} bg={selected ? colors.surface : colors.primarySoft} />
                <Text style={[type.caption, { color: colors.text, fontWeight: '700' }]}>{t(`beverages.${id}`)}</Text>
              </PressableScale>
            );
          })}
        </View>
      </Field>

      <Card style={{ gap: spacing.md, alignItems: 'stretch' }}>
        <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t('logCustom.amount')}</Text>
        <Text style={[styles.big, { color: colors.text, fontFamily: fonts.display }]} accessibilityElementsHidden importantForAccessibility="no">
          {volume(amount, unit)}
        </Text>
        <AmountStepper
          valueMl={amount}
          onChange={setAmount}
          unit={unit}
          minMl={AMOUNT_MIN}
          maxMl={AMOUNT_MAX}
          kind="drink"
          label={t('logCustom.amount')}
          decreaseLabel={t('logCustom.less')}
          increaseLabel={t('logCustom.more')}
        />
        <View style={styles.chips}>
          {presets.map((ml) => (
            <Chip key={ml} label={volume(ml, unit)} selected={ml === amount} onPress={() => setAmount(ml)} />
          ))}
        </View>
        {factor < 1 && (
          <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted }]}>
            {t('logCustom.counts', { beverage: t(`beverages.${beverage}`), amount: volume(amount, unit), effective: volume(counted, unit) })}
          </Text>
        )}
      </Card>

      <SettingsGroup>
        <ControlRow label={t('logCustom.time')} icon={Clock}>
          <MinuteField value={minute} onChange={setMinute} label={t('logCustom.time')} minuteStep={1} />
        </ControlRow>
      </SettingsGroup>

      <View style={{ gap: spacing.sm }}>
        <PrimaryButton label={submitLabel} onPress={() => onSubmit({ beverage, volumeMl: amount, minute })} />
        {footer}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  drink: { flexBasis: '30%', flexGrow: 1, minHeight: 84, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  big: { fontSize: 40, lineHeight: 46, fontWeight: '800', textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
