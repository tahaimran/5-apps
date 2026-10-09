import { Redirect } from 'expo-router';
import { useOnboardingComplete } from '@shared/onboarding';

/** First launch goes through setup (plan §6); after that the app opens on the Timer. */
export default function Index() {
  const done = useOnboardingComplete();
  if (!done) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/timer" />;
}
