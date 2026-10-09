import { useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingFlow } from '@shared/onboarding';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { startAds } from '@/ads/start';
import { applyOnboardingAnswers, clearOnboardingResume } from '@/features/onboarding/finish';
import { buildSteps } from '@/features/onboarding/steps';
import { db } from '@/store/storage';

export default function Onboarding() {
  const { colors } = useTheme();
  const skipped = useRef(false);
  const steps = useMemo(
    () =>
      buildSteps((ctx) => {
        skipped.current = true;
        ctx.finish();
      }),
    [],
  );
  // Killed mid-flow: pick up at the same screen with the answers so far (plan §6).
  const initial = useMemo(() => db.get('onboarding.resume'), []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingFlow
        steps={steps}
        initial={initial}
        onProgress={(progress) => db.set('onboarding.resume', progress)}
        labels={{ skip: t('onboarding.skip'), done: t('onboarding.allSet') }}
        // Skip, top right on every screen but the last: save what was entered so far and go to the Timer with safe defaults.
        onSkip={({ finish }) => {
          skipped.current = true;
          finish();
        }}
        onDone={(answers) => {
          const setup = applyOnboardingAnswers(answers);
          clearOnboardingResume();
          const go = () => router.replace(setup.landing);
          // Plan §6: the consent form (when the region requires one) comes after the last screen and before the Timer.
          // After Skip it waits until the person first leaves the Timer, so it never covers the button.
          if (skipped.current) go();
          else void startAds().finally(go);
        }}
      />
    </SafeAreaView>
  );
}
