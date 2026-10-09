import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { CategoryChips } from '@/components/CategoryChips';
import { TimeStepper } from '@/components/TimeStepper';
import type { CategoryId, Difficulty } from '@/domain/types';
import { DEFAULT_REMINDER } from '@/domain/reminder';
import { AppText } from '@/ui/AppText';
import { OptionCard } from '@/ui/OptionCard';
import { DEFAULT_DIFFICULTY, DEFAULT_PICKS, MIN_CATEGORIES, warmupVerdict } from './answers';

const LEVELS: Difficulty[] = [1, 2, 3];

/** O1 illustration: a stack of question cards with a lightbulb. Decorative, hidden from screen readers. */
function WelcomeArt() {
  const { colors, radius } = useTheme();
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 200, height: 150 }}>
        {[16, 8, 0].map((offset, i) => (
          <View key={offset} style={{ position: 'absolute', top: offset, left: offset, right: 16 - offset, height: 120, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary, backgroundColor: i === 2 ? colors.surface : colors.surfaceAlt }} />
        ))}
        <View style={{ position: 'absolute', top: 30, left: 0, right: 16, alignItems: 'center' }}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={64} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}

function CategoriesStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing } = useTheme();
  const value = (ctx.value as CategoryId[] | undefined) ?? DEFAULT_PICKS;
  return (
    <View style={{ gap: spacing.md }}>
      <CategoryChips value={value} onChange={(next) => ctx.setValue(next)} />
      <AppText accessibilityLiveRegion="polite" variant="body" style={{ color: colors.textMuted, fontWeight: '700' }}>
        {value.length >= MIN_CATEGORIES ? t('onboarding.pickedEnough', { count: value.length }) : t('onboarding.pickedCount', { count: value.length, need: MIN_CATEGORIES })}
      </AppText>
    </View>
  );
}

function DifficultyStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing } = useTheme();
  const value = (ctx.value as Difficulty | undefined) ?? DEFAULT_DIFFICULTY;
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
      {LEVELS.map((d) => (
        <OptionCard key={d} label={t(`difficulty.${d}`)} detail={t(`onboarding.difficultyDetail.${d}`)} selected={value === d} onPress={() => ctx.setValue(d)} />
      ))}
      <AppText variant="body" style={{ color: colors.textMuted, marginTop: spacing.sm }}>{t('onboarding.difficultyFooter')}</AppText>
    </View>
  );
}

/**
 * Plan §6 O1-O3 on the shared flow. Skip on O2 and O3 uses the defaults; "I've played before - skip
 * intro" on O1 finishes with `intro: 'skip'` (the caller then jumps past the warm-up).
 */
export function buildSetupSteps(): OnboardingStep[] {
  return [
    {
      key: 'welcome',
      title: t('onboarding.welcomeTitle'),
      body: t('onboarding.welcomeBody'),
      media: <WelcomeArt />,
      cta: t('onboarding.letsPlay'),
      skippable: false,
      secondary: { label: t('onboarding.skipIntro'), onPress: (ctx) => ctx.finish({ intro: 'skip' }) },
    },
    {
      key: 'categories',
      title: t('onboarding.categoriesTitle'),
      body: t('onboarding.categoriesBody'),
      render: (ctx) => <CategoriesStep ctx={ctx} />,
      canContinue: ({ value }) => ((value as CategoryId[] | undefined) ?? DEFAULT_PICKS).length >= MIN_CATEGORIES,
      cta: t('onboarding.continue'),
    },
    {
      key: 'difficulty',
      title: t('onboarding.difficultyTitle'),
      render: (ctx) => <DifficultyStep ctx={ctx} />,
      cta: t('onboarding.startWarmup'),
    },
  ];
}

export interface FinishOptions {
  /** The warm-up was played (not skipped). */
  warmupScore: number;
  /** Google UMP will show a form here, so the pre-screen is shown (plan §6 O6). */
  consentRequired: boolean;
  onConsent: () => Promise<void>;
  onRemind: (hour: number, minute: number) => Promise<void>;
  onDecline: () => void;
}

/** Plan §6 O5-O7: warm-up result, consent pre-screen (only where a form follows), and the reminder ask. */
export function buildFinishSteps(o: FinishOptions): OnboardingStep[] {
  const verdict = warmupVerdict(Math.max(0, o.warmupScore));
  return [
    {
      key: 'result',
      title: t(`onboarding.result.${verdict}`),
      body: t('onboarding.resultBody'),
      cta: t('onboarding.continue'),
      hidden: () => o.warmupScore < 0,
    },
    {
      key: 'consent',
      title: t('onboarding.consentTitle'),
      body: t('onboarding.consentBody'),
      cta: t('onboarding.ok'),
      skippable: false,
      hidden: () => !o.consentRequired,
      onContinue: o.onConsent,
    },
    {
      key: 'reminder',
      title: t('onboarding.reminderTitle'),
      body: t('onboarding.reminderBody'),
      render: (ctx) => {
        const time = (ctx.value as { hour: number; minute: number } | undefined) ?? DEFAULT_REMINDER;
        return <TimeStepper hour={time.hour} minute={time.minute} onChange={(hour, minute) => ctx.setValue({ hour, minute })} />;
      },
      cta: t('onboarding.remindMe'),
      onContinue: (ctx) => {
        const time = (ctx.value as { hour: number; minute: number } | undefined) ?? DEFAULT_REMINDER;
        return o.onRemind(time.hour, time.minute);
      },
      secondary: {
        label: t('onboarding.notNow'),
        onPress: (ctx) => {
          o.onDecline();
          ctx.finish();
        },
      },
    },
  ];
}
