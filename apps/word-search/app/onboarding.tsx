import { useMemo } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingFlow } from '@shared/onboarding';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { startAds } from '@/ads/start';
import { applyOnboardingAnswers, clearOnboardingResume } from '@/features/onboarding/finish';
import { buildSteps } from '@/features/onboarding/steps';
import { TUTORIAL_ID } from '@/domain/puzzles';
import { db } from '@/store/storage';

export default function Onboarding() {
  const { colors } = useTheme();
  const steps = useMemo(() => buildSteps(), []);
  // Killed mid-flow: pick up at the same screen with the answers so far (plan §6).
  const initial = useMemo(() => db.get('onboarding.resume'), []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingFlow
        steps={steps}
        initial={initial}
        onProgress={(progress) => db.set('onboarding.resume', progress)}
        labels={{ done: t('onboarding.startFirst') }}
        onDone={(answers) => {
          applyOnboardingAnswers(answers);
          clearOnboardingResume();
          // The consent form (when the region requires one) comes before the first puzzle, so every
          // later ad request is compliant. It never throws and never blocks when none is needed.
          void startAds().finally(() => router.replace({ pathname: '/play/[puzzleId]', params: { puzzleId: TUTORIAL_ID } }));
        }}
      />
    </SafeAreaView>
  );
}
