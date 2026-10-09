import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useOnboardingComplete } from '@shared/onboarding';
import { replaceWithRound } from '@/features/play/navigation';
import { startWarmup } from '@/features/play/start';
import { skipWarmup } from '@/features/onboarding/finish';
import { db } from '@/store/storage';

/** Setup was answered but the app was closed before the warm-up: play it now. */
function ResumeWarmup() {
  useEffect(() => {
    if (!replaceWithRound(startWarmup())) skipWarmup();
  }, []);
  return null;
}

/**
 * Routing at launch (plan §6): setup screens, then the warm-up quiz, then the closing screens, then
 * Home. Each step's flag is stored, so a kill in the middle resumes at the right place.
 */
export default function Index() {
  const setupDone = useOnboardingComplete();
  const [warmupDone] = db.useStored('onboarding.warmupDone', false);
  const [done] = db.useStored('onboarding.done', false);
  if (!setupDone) return <Redirect href="/welcome" />;
  if (!warmupDone) return <ResumeWarmup />;
  if (!done) return <Redirect href="/warmup-result" />;
  return <Redirect href="/(tabs)" />;
}
