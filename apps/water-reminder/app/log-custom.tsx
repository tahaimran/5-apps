import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { atMinute, localDateKey, minuteOfDay } from '@/domain/dayKey';
import { beverageIcons, effectiveMl, factorOf } from '@/domain/hydration';
import type { BeverageId } from '@/domain/types';
import { flozToMl, mlToFloz } from '@/domain/units';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useWater } from '@/store/water';
import { spokenVolume, volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { Slider } from '@/ui/Slider';
import { Field, MinuteStepper, PrimaryButton, TextField } from '@/ui/controls';

export const AMOUNT_MIN = 50;
export const AMOUNT_MAX = 1000;
export const AMOUNT_STEP = 10;
const DRINKS: BeverageId[] = ['water', 'sparkling', 'tea', 'coffee', 'juice', 'milk'];

/** The amount in the unit the user types in, back to ml. */
export const parseAmount = (text: string, unit: 'ml' | 'floz'): number | null => {
  const n = Number(text.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(unit === 'ml' ? n : flozToMl(n));
};

export default function LogCustom() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const feedback = useFeedback();
  const unit = useSettings((s) => s.goal.unit);
  const beverages = useSettings((s) => s.beverages);
  const [beverage, setBeverage] = useState<BeverageId>('water');
  const [amount, setAmount] = useState(250);
  const [typed, setTyped] = useState<string | null>(null);
  const [minute, setMinute] = useState(() => minuteOfDay(new Date()));

  const factor = factorOf(beverages, beverage);
  const counted = effectiveMl(amount, factor);
  const shown = typed ?? String(unit === 'ml' ? amount : mlToFloz(amount));

  const setFromSlider = (v: number) => {
    setTyped(null);
    setAmount(v);
  };
  const setFromText = (text: string) => {
    setTyped(text);
    const ml = parseAmount(text, unit);
    if (ml !== null) setAmount(Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, ml)));
  };

  const submit = () => {
    const now = new Date();
    let ts = atMinute(localDateKey(now), minute).getTime();
    if (ts > now.getTime()) ts -= 86_400_000; // a later time of day means last night
    feedback.tap();
    useWater.getState().logDrink({ volumeMl: amount, beverage, ts, source: 'app' });
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('logCustom.title'), headerShown: true }} />
      <Field label={t('logCustom.beverage')}>
        <View style={styles.wrap} accessibilityRole="radiogroup">
          {DRINKS.map((id) => {
            const selected = id === beverage;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`beverages.${id}`)}
                onPress={() => setBeverage(id)}
                style={{
                  minHeight: 64,
                  minWidth: 88,
                  flexGrow: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  borderRadius: radius.md,
                  borderWidth: 2,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '1A' : colors.surface,
                }}
              >
                <MaterialCommunityIcons name={beverageIcons[id] as never} size={24} color={selected ? colors.primary : colors.textMuted} />
                <Text style={[type.caption, { color: colors.text, fontWeight: '600' }]}>{t(`beverages.${id}`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label={t('logCustom.amount')}>
        <Text style={[type.display, { color: colors.text, fontWeight: '800' }]}>{volume(amount, unit)}</Text>
        <Slider
          value={amount}
          min={AMOUNT_MIN}
          max={AMOUNT_MAX}
          step={AMOUNT_STEP}
          onChange={setFromSlider}
          label={t('logCustom.amount')}
          valueText={spokenVolume(amount, unit)}
        />
        <TextField
          value={shown}
          onChangeText={setFromText}
          label={t('logCustom.amountInput', { unit: t(`units.${unit}`) })}
          keyboardType="decimal-pad"
          maxLength={6}
        />
        {factor < 1 && (
          <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted }]}>
            {t('logCustom.counts', { beverage: t(`beverages.${beverage}`), amount: volume(amount, unit), effective: volume(counted, unit) })}
          </Text>
        )}
      </Field>

      <Field label={t('logCustom.time')}>
        <MinuteStepper value={minute} onChange={setMinute} label={t('logCustom.time')} minuteStep={5} />
      </Field>

      <View style={{ marginTop: spacing.md, minHeight: touchTarget }}>
        <PrimaryButton label={t('logCustom.add')} onPress={submit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
