import { Redirect } from 'expo-router';
import { useOnboardingComplete } from '@shared/onboarding';
import { landingRoute } from '@/features/onboarding/landing';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useToday } from '@/store/today';

/**
 * First launch goes through setup (plan §6). After that the app always opens on the Timer, except that when
 * "Counting kicks" was the only need chosen it opens on Kicks on that first day only (plan §4).
 */
export default function Index() {
  const done = useOnboardingComplete();
  const needs = useProfile((s) => s.profile.needs);
  const day = useMeta((s) => s.meta.onboardingDay);
  const today = useToday((s) => s.today);
  if (!done) return <Redirect href="/onboarding" />;
  return <Redirect href={landingRoute(needs, day, today)} />;
}
