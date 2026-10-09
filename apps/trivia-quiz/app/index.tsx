import { Redirect } from 'expo-router';

/** The entry route. Onboarding routing is added with milestone 5. */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
