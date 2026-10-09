import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingFlow } from '@shared/onboarding';
import { isConsentFormRequired } from '@shared/consent';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { startAds } from '@/ads/start';
import { markOnboardingDone } from '@/features/onboarding/finish';
import { buildFinishSteps } from '@/features/onboarding/steps';
import { enableReminder } from '@/notifications/reminder';
import { logFunnel } from '@/store/funnel';
import { db } from '@/store/storage';

/**
 * Plan §6 O5-O7: the warm-up result, the consent pre-screen (only where Google's form follows, so
 * consent is asked after the first value and before the first ad request) and the reminder ask.
 */
export default function WarmupResult() {
  useAdScreen('onboarding');
  const { colors } = useTheme();
  const [required, setRequired] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    isConsentFormRequired()
      .then((r) => alive && setRequired(r))
      .catch(() => alive && setRequired(false));
    return () => {
      alive = false;
    };
  }, []);
  const warmupScore = db.get('onboarding.warmupScore') ?? -1;
  const steps = useMemo(
    () =>
      required === null
        ? []
        : buildFinishSteps({
            warmupScore,
            consentRequired: required,
            onConsent: async () => {
              logFunnel('onb_consent_shown');
              await startAds();
            },
            onRemind: async (hour, minute) => {
              const result = await enableReminder(hour, minute);
              if (result === 'enabled') logFunnel('onb_notif_accept');
              else {
                logFunnel('onb_notif_decline');
                db.set('reminderAsk', { declinedAt: Date.now(), reaskedAt: 0 });
              }
            },
            onDecline: () => {
              logFunnel('onb_notif_decline');
              db.set('reminderAsk', { declinedAt: Date.now(), reaskedAt: 0 });
            },
          }),
    [required, warmupScore],
  );
  if (required === null) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingFlow
        steps={steps}
        // Skip never bypasses the consent form where one is required.
        onSkip={(ctx) => ctx.jumpTo(required ? 'consent' : 'reminder')}
        onDone={() => {
          markOnboardingDone();
          // Ads start after the first value is delivered; where no form was needed this is the first moment.
          void startAds();
          router.replace('/(tabs)');
        }}
      />
    </SafeAreaView>
  );
}
