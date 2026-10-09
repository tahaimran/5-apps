import { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingFlow } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { applyOnboardingAnswers, clearOnboardingResume, skipWarmup } from '@/features/onboarding/finish';
import { buildSetupSteps } from '@/features/onboarding/steps';
import { replaceWithRound } from '@/features/play/navigation';
import { startWarmup } from '@/features/play/start';
import { db } from '@/store/storage';
import { logFunnel } from '@/store/funnel';

/**
 * First launch, screens O1-O3 (plan §6). When the last one is done the warm-up quiz starts at once
 * (O4); "skip intro" goes straight to the closing screens. Killed mid-way, it resumes at the same screen.
 */
export default function Welcome() {
  const { colors } = useTheme();
  const steps = useMemo(() => buildSetupSteps(), []);
  const initial = useMemo(() => db.get('onboarding.resume'), []);
  useEffect(() => {
    if (!initial) logFunnel('onb_start');
  }, [initial]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingFlow
        steps={steps}
        initial={initial}
        onProgress={(progress) => db.set('onboarding.resume', progress)}
        onDone={(answers) => {
          const skipped = applyOnboardingAnswers(answers);
          clearOnboardingResume();
          if (skipped) {
            skipWarmup();
            router.replace('/warmup-result');
          } else if (!replaceWithRound(startWarmup())) {
            skipWarmup();
            router.replace('/warmup-result');
          }
        }}
      />
    </SafeAreaView>
  );
}
