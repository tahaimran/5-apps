import type { DateKey, Need } from '@/domain/types';

/** Plan §4: the Timer, except Kicks on the day onboarding finished when kicks were the only need. */
export function landingRoute(needs: readonly Need[], onboardingDay: DateKey | undefined, today: DateKey): '/(tabs)/timer' | '/(tabs)/kicks' {
  return needs.length === 1 && needs[0] === 'kicks' && onboardingDay === today ? '/(tabs)/kicks' : '/(tabs)/timer';
}
