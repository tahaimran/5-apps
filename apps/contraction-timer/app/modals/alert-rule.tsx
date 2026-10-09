import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { CUSTOM_LIMITS, RULE_PRESETS } from '@/domain/defaults';
import type { PatternRule, RulePreset } from '@/domain/types';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { OptionCard } from '@/ui/OptionCard';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Stepper } from '@/ui/Stepper';

const PRESETS: { preset: RulePreset; label: string }[] = [
  { preset: '511', label: 'rule.p511' },
  { preset: '411', label: 'rule.p411' },
  { preset: '311', label: 'rule.p311' },
  { preset: 'custom', label: 'rule.custom' },
];

const clamp = (n: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, n));
const describe = (r: PatternRule) => t('rule.describe', { interval: r.intervalMaxMin, length: r.durationMinSec, sustain: r.sustainMin });

/** Plan F5, §8.2: 5-1-1, 4-1-1, 3-1-1 or a custom rule (2–10 minutes apart, 30–90 seconds long, held for 30–120 minutes). */
export default function AlertRule() {
  const { colors, spacing, type } = useTheme();
  const current = useSettings((s) => s.settings.rule);
  const [rule, setRule] = useState<PatternRule>(current);
  const custom = rule.preset === 'custom';
  const choose = (preset: RulePreset) => setRule(preset === 'custom' ? { ...rule, preset: 'custom' } : RULE_PRESETS[preset]);
  const patch = (p: Partial<PatternRule>) => setRule({ ...rule, ...p, preset: 'custom' });
  return (
    <Screen>
      <ScreenHeader title={t('rule.title')} onBack={() => router.back()} />
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('rule.intro')}</AppText>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        {PRESETS.map((p) => (
          <OptionCard key={p.preset} label={t(p.label)} detail={p.preset === 'custom' ? undefined : describe(RULE_PRESETS[p.preset])} selected={rule.preset === p.preset} onPress={() => choose(p.preset)} />
        ))}
      </View>
      {custom ? (
        <View style={{ gap: spacing.sm }}>
          <Stepper
            label={t('rule.interval')}
            value={t('rule.intervalValue', { n: rule.intervalMaxMin })}
            minusLabel={t('rule.intervalLess')}
            plusLabel={t('rule.intervalMore')}
            minusDisabled={rule.intervalMaxMin <= CUSTOM_LIMITS.intervalMaxMin.min}
            plusDisabled={rule.intervalMaxMin >= CUSTOM_LIMITS.intervalMaxMin.max}
            onMinus={() => patch({ intervalMaxMin: clamp(rule.intervalMaxMin - 1, CUSTOM_LIMITS.intervalMaxMin) })}
            onPlus={() => patch({ intervalMaxMin: clamp(rule.intervalMaxMin + 1, CUSTOM_LIMITS.intervalMaxMin) })}
          />
          <Stepper
            label={t('rule.length')}
            value={t('rule.lengthValue', { n: rule.durationMinSec })}
            minusLabel={t('rule.lengthLess')}
            plusLabel={t('rule.lengthMore')}
            minusDisabled={rule.durationMinSec <= CUSTOM_LIMITS.durationMinSec.min}
            plusDisabled={rule.durationMinSec >= CUSTOM_LIMITS.durationMinSec.max}
            onMinus={() => patch({ durationMinSec: clamp(rule.durationMinSec - 5, CUSTOM_LIMITS.durationMinSec) })}
            onPlus={() => patch({ durationMinSec: clamp(rule.durationMinSec + 5, CUSTOM_LIMITS.durationMinSec) })}
          />
          <Stepper
            label={t('rule.sustain')}
            value={t('rule.sustainValue', { n: rule.sustainMin })}
            minusLabel={t('rule.sustainLess')}
            plusLabel={t('rule.sustainMore')}
            minusDisabled={rule.sustainMin <= CUSTOM_LIMITS.sustainMin.min}
            plusDisabled={rule.sustainMin >= CUSTOM_LIMITS.sustainMin.max}
            onMinus={() => patch({ sustainMin: clamp(rule.sustainMin - 10, CUSTOM_LIMITS.sustainMin) })}
            onPlus={() => patch({ sustainMin: clamp(rule.sustainMin + 10, CUSTOM_LIMITS.sustainMin) })}
          />
          <AppText style={[type.bodyLarge, { color: colors.text }]}>{describe(rule)}</AppText>
        </View>
      ) : null}
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t('rule.note')}</AppText>
      <BigButton
        tall
        label={t('rule.save')}
        onPress={() => {
          useSettings.getState().update({ rule });
          router.back();
        }}
      />
    </Screen>
  );
}
