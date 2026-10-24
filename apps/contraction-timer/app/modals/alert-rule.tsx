import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import HeartHandshake from 'lucide-react-native/icons/heart-handshake';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, Stepper } from '@shared/ui';
import { CUSTOM_LIMITS, RULE_PRESETS } from '@/domain/defaults';
import type { PatternRule, RulePreset } from '@/domain/types';
import { useSettings } from '@/store/settings';
import { AlertCard } from '@/ui/AlertCard';
import { AppText } from '@/ui/AppText';
import { OptionCard } from '@/ui/OptionCard';
import { Screen } from '@/ui/Screen';

const PRESETS: { preset: RulePreset; label: string }[] = [
  { preset: '511', label: 'rule.p511' },
  { preset: '411', label: 'rule.p411' },
  { preset: '311', label: 'rule.p311' },
  { preset: 'custom', label: 'rule.custom' },
];

const describe = (r: PatternRule) => t('rule.describe', { interval: r.intervalMaxMin, length: r.durationMinSec, sustain: r.sustainMin });

/** Plan F5, §8.2: 5-1-1, 4-1-1, 3-1-1 or a custom rule (2–10 minutes apart, 30–90 seconds long, held for 30–120 minutes). */
export default function AlertRule() {
  const { colors, spacing, type } = useTheme();
  const current = useSettings((s) => s.settings.rule);
  const [rule, setRule] = useState<PatternRule>(current);
  const custom = rule.preset === 'custom';
  const choose = (preset: RulePreset) => setRule(preset === 'custom' ? { ...rule, preset: 'custom' } : RULE_PRESETS[preset]);
  const patch = (p: Partial<PatternRule>) => setRule({ ...rule, ...p, preset: 'custom' });
  const field = (label: string, node: React.ReactNode) => (
    <View style={{ gap: spacing.sm }}>
      <AppText style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{label}</AppText>
      {node}
    </View>
  );
  return (
    <Screen modal title={t('rule.title')} onBack={() => router.back()}>
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('rule.intro')}</AppText>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        {PRESETS.map((p) => (
          <OptionCard key={p.preset} label={t(p.label)} detail={p.preset === 'custom' ? undefined : describe(RULE_PRESETS[p.preset])} selected={rule.preset === p.preset} onPress={() => choose(p.preset)} />
        ))}
      </View>
      {custom ? (
        <Card style={{ gap: spacing.lg }}>
          {field(
            t('rule.interval'),
            <Stepper
              label={t('rule.interval')}
              value={rule.intervalMaxMin}
              min={CUSTOM_LIMITS.intervalMaxMin.min}
              max={CUSTOM_LIMITS.intervalMaxMin.max}
              format={(n) => t('rule.intervalValue', { n })}
              decreaseLabel={t('rule.intervalLess')}
              increaseLabel={t('rule.intervalMore')}
              onChange={(intervalMaxMin) => patch({ intervalMaxMin })}
            />,
          )}
          {field(
            t('rule.length'),
            <Stepper
              label={t('rule.length')}
              value={rule.durationMinSec}
              min={CUSTOM_LIMITS.durationMinSec.min}
              max={CUSTOM_LIMITS.durationMinSec.max}
              step={5}
              format={(n) => t('rule.lengthValue', { n })}
              decreaseLabel={t('rule.lengthLess')}
              increaseLabel={t('rule.lengthMore')}
              onChange={(durationMinSec) => patch({ durationMinSec })}
            />,
          )}
          {field(
            t('rule.sustain'),
            <Stepper
              label={t('rule.sustain')}
              value={rule.sustainMin}
              min={CUSTOM_LIMITS.sustainMin.min}
              max={CUSTOM_LIMITS.sustainMin.max}
              step={10}
              format={(n) => t('rule.sustainValue', { n })}
              decreaseLabel={t('rule.sustainLess')}
              increaseLabel={t('rule.sustainMore')}
              onChange={(sustainMin) => patch({ sustainMin })}
            />,
          )}
          <AppText style={[type.bodyLarge, { color: colors.text }]}>{describe(rule)}</AppText>
        </Card>
      ) : null}
      <AlertCard icon={HeartHandshake}>{t('rule.note')}</AlertCard>
      <Button
        label={t('rule.save')}
        onPress={() => {
          useSettings.getState().update({ rule });
          router.back();
        }}
      />
    </Screen>
  );
}
