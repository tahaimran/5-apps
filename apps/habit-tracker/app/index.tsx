import { Redirect } from 'expo-router';
import { useOnboardingComplete } from '@shared/onboarding';

/** First launch goes through onboarding (plan §6); it never shows again once completed. */
export default function Index() {
  const done = useOnboardingComplete();
  return <Redirect href={done ? '/(tabs)' : '/onboarding'} />;
}
