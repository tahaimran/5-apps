import { PixelRatio, View } from 'react-native';
import Compass from 'lucide-react-native/icons/compass';
import MoveDiagonal from 'lucide-react-native/icons/move-diagonal';
import MoveRight from 'lucide-react-native/icons/move-right';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import type { IconComponent } from '@shared/ui';
import { TextSizePicker } from '@/components/TextSizePicker';
import type { Difficulty } from '@/domain/types';
import { SceneArt } from '@/features/packs/PackArt';
import { AppText } from '@/ui/AppText';
import { OptionCard } from '@/ui/OptionCard';
import { SettingsGroup, SwitchRow } from '@/ui/SettingsRow';
import { defaultTextSize, SETUP_DEFAULTS, type OnboardingAnswers } from './answers';

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];
const LEVEL_ICONS: Record<Difficulty, IconComponent> = { easy: MoveRight, medium: MoveDiagonal, hard: Compass };

/** Plan §6 screen 1: a magnifying glass over large letters. */
function Welcome() {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', paddingVertical: 8 }}>
      <SceneArt scene="welcome" px={200} />
    </View>
  );
}

function TextSizeStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const display = (ctx.value as OnboardingAnswers['display']) ?? { textSize: defaultTextSize(PixelRatio.getFontScale()), highContrast: false };
  return (
    <View style={{ gap: spacing.lg }}>
      <TextSizePicker value={display.textSize} onChange={(textSize) => ctx.setValue({ ...display, textSize })} />
      <SettingsGroup>
        <SwitchRow label={t('onboarding.highContrast')} value={display.highContrast} onChange={(highContrast) => ctx.setValue({ ...display, highContrast })} />
      </SettingsGroup>
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
        <OptionCard key={d} icon={LEVEL_ICONS[d]} label={t(`onboarding.level.${d}`)} detail={t(`onboarding.level.${d}Detail`)} selected={value === d} onPress={() => ctx.setValue(d)} />
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
