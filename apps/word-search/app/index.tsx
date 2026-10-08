import { Redirect } from 'expo-router';
import { useOnboardingComplete } from '@shared/onboarding';
import { TUTORIAL_ID } from '@/domain/puzzles';
import { db } from '@/store/storage';

/**
 * First launch goes through setup, then the tutorial puzzle (plan §6); the flag that ends
 * onboarding is set when the tutorial is finished or skipped, so a kill in the middle resumes there.
 */
export default function Index() {
  const setupDone = useOnboardingComplete();
  const [tutorialDone] = db.useStored('onboarding.tutorialDone', false);
  if (!setupDone) return <Redirect href="/onboarding" />;
  if (!tutorialDone) return <Redirect href={{ pathname: '/play/[puzzleId]', params: { puzzleId: TUTORIAL_ID } }} />;
  return <Redirect href="/(tabs)" />;
}
