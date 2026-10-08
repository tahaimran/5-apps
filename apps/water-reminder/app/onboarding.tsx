import { useMemo } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingFlow } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { applyOnboardingAnswers, clearOnboardingResume } from '@/features/onboarding/finish';
import { buildSteps } from '@/features/onboarding/steps';
import { db } from '@/store/storage';

export default function Onboarding() {
  const { colors } = useTheme();
  const steps = useMemo(() => buildSteps(), []);
  // Killed mid-flow: pick up at the last step with the answers so far (plan §6).
  const initial = useMemo(() => db.get('onboarding:resume'), []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingFlow
        steps={steps}
        initial={initial}
        onProgress={(progress) => db.set('onboarding:resume', progress)}
        // Skip applies the defaults, but the notification step and consent still come before Today.
        onSkip={(ctx) => ctx.jumpTo('permission', { skipped: true })}
        onDone={(answers) => {
          applyOnboardingAnswers(answers);
          clearOnboardingResume();
          router.replace('/(tabs)');
        }}
      />
    </SafeAreaView>
  );
}
