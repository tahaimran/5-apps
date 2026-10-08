import { PixelRatio, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { TextSizePicker } from '@/components/TextSizePicker';
import type { Difficulty } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { OptionCard } from '@/ui/OptionCard';
import { SwitchRow } from '@/ui/SwitchRow';
import { defaultTextSize, SETUP_DEFAULTS, type OnboardingAnswers } from './answers';

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

function Welcome() {
  const { colors } = useTheme();
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 180, height: 180, borderRadius: 90, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary }}>
        <MaterialCommunityIcons name="magnify" size={120} color={colors.primary} />
      </View>
    </View>
  );
}

function TextSizeStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const display = (ctx.value as OnboardingAnswers['display']) ?? { textSize: defaultTextSize(PixelRatio.getFontScale()), highContrast: false };
  return (
    <View style={{ gap: spacing.lg }}>
      <TextSizePicker value={display.textSize} onChange={(textSize) => ctx.setValue({ ...display, textSize })} />
      <SwitchRow label={t('onboarding.highContrast')} value={display.highContrast} onChange={(highContrast) => ctx.setValue({ ...display, highContrast })} />
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('onboarding.sizeNote')}</AppText>
    </View>
  );
}

function LevelStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const value = (ctx.value as Difficulty | undefined) ?? SETUP_DEFAULTS.difficulty;
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
      {LEVELS.map((d) => (
        <OptionCard key={d} label={t(`onboarding.level.${d}`)} detail={t(`onboarding.level.${d}Detail`)} selected={value === d} onPress={() => ctx.setValue(d)} />
      ))}
      <AppText style={[type.body, { color: colors.textMuted, marginTop: spacing.sm }]}>{t('onboarding.levelFooter')}</AppText>
    </View>
  );
}

/**
 * The three setup screens of DEVELOPMENT_PLAN.md §6. The consent form (screen 4) is not a step: it
 * opens right after the last one, in `app/onboarding.tsx`, and the tutorial puzzle (screen 5) is the
 * play screen. Skip on screens 2 and 3 keeps Large text and Easy.
 */
export function buildSteps(): OnboardingStep[] {
  return [
    {
      key: 'welcome',
      title: t('onboarding.welcomeTitle'),
      body: t('onboarding.welcomeBody'),
      media: <Welcome />,
      cta: t('onboarding.begin'),
      skippable: false,
    },
    {
      key: 'display',
      title: t('onboarding.sizeTitle'),
      body: t('onboarding.sizeBody'),
      render: (ctx) => <TextSizeStep ctx={ctx} />,
      cta: t('onboarding.continue'),
    },
    {
      key: 'level',
      title: t('onboarding.levelTitle'),
      render: (ctx) => <LevelStep ctx={ctx} />,
      cta: t('onboarding.startFirst'),
    },
  ];
}
