import { useMemo } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingFlow } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { applyOnboardingAnswers } from '@/features/onboarding/finish';
import { buildSteps } from '@/features/onboarding/steps';
import { useProfile } from '@/store/profile';

export default function Onboarding() {
  const { colors } = useTheme();
  const steps = useMemo(
    () => buildSteps((granted) => useProfile.getState().update({ notifPermission: granted ? 'granted' : 'denied' })),
    [],
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingFlow
        steps={steps}
        onDone={(answers) => {
          applyOnboardingAnswers(answers);
          router.replace('/(tabs)');
        }}
      />
    </SafeAreaView>
  );
}
