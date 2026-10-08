import { Redirect } from 'expo-router';

// Onboarding (plan §6) is milestone 6; until then land on Today.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
