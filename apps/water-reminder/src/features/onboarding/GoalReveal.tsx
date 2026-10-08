import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { goalBreakdown, glassesOf } from '@/domain/goal';
import type { Profile } from '@/domain/types';
import { formatAmount, groupDigits, kgToLb, roundTo } from '@/domain/units';

const ROW_MS = 300;
const COUNT_STEPS = 12;

const signed = (ml: number) => `${ml < 0 ? '−' : '+'}${groupDigits(Math.abs(ml))} ${t('units.ml')}`;

/**
 * The goal calculation as rows that tick in one by one (300 ms each), then the goal counting up
 * (plan §6 step 6). With reduced motion everything shows at once.
 */
export function GoalReveal({ profile, goalMl }: { profile: Profile; goalMl: number }) {
  const { colors, spacing, radius, type } = useTheme();
  const reduced = useReducedMotion();
  const b = goalBreakdown(profile);
  const rows: string[] = [
    t('onboarding.goalRowBase', {
      weight: t('units.amount', { value: profile.weightUnit === 'kg' ? profile.weightKg : kgToLb(profile.weightKg), unit: t(`units.${profile.weightUnit}`) }),
      amount: `${formatAmount(roundTo(b.baseMl, 50), 'ml')} ${t('units.ml')}`,
    }),
    t('onboarding.goalRowActivity', { label: t(`onboarding.activityShort.${profile.activity}`), amount: signed(b.activityMl) }),
    t('onboarding.goalRowClimate', { label: t(`onboarding.climateShort.${profile.climate}`), amount: signed(b.climateMl) }),
  ];
  if (b.sexMl !== 0) rows.push(t('onboarding.goalRowSex', { amount: signed(b.sexMl) }));

  const [shown, setShown] = useState(reduced ? rows.length : 0);
  const [count, setCount] = useState(reduced ? goalMl : 0);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setShown((n) => Math.min(rows.length, n + 1)), ROW_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, rows.length]);

  useEffect(() => {
    if (reduced) {
      setCount(goalMl);
      return;
    }
    if (shown < rows.length) return;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setCount(step >= COUNT_STEPS ? goalMl : Math.round((goalMl * step) / COUNT_STEPS / 10) * 10);
      if (step >= COUNT_STEPS) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [reduced, shown, rows.length, goalMl]);

  const done = count === goalMl && shown >= rows.length;
  return (
    <View style={{ gap: spacing.sm }}>
      {rows.slice(0, shown).map((row) => (
        <Text key={row} style={[type.bodyLarge, { color: colors.textMuted }]}>
          {row}
        </Text>
      ))}
      <View
        accessible
        accessibilityLabel={t('onboarding.goalIs') + ' ' + `${formatAmount(goalMl, 'ml')} ${t('units.ml')}`}
        accessibilityLiveRegion="polite"
        style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.md, opacity: done || shown >= rows.length ? 1 : 0.35 }}
      >
        <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{t('onboarding.goalIs')}</Text>
        <Text style={[type.display, { color: colors.primary, fontWeight: '800' }]}>
          {formatAmount(count, 'ml')} {t('units.ml')}
        </Text>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.goalApprox', { count: glassesOf(goalMl) })}</Text>
      </View>
    </View>
  );
}
