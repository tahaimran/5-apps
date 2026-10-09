import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useOnboardingComplete } from '@shared/onboarding';
import { startAds } from '@/ads/start';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useSessions } from '@/store/sessions';

/** The Timer button's own screen. History, session details and the other tabs are not it. */
export const isTimerButtonScreen = (pathname: string): boolean => pathname === '/' || pathname === '/timer' || pathname === '/timer/' || pathname.startsWith('/onboarding');

/**
 * Starts consent and the ads SDK for people who did not come through the last onboarding screen (they skipped, or this is a later
 * launch). Never on the Timer button's own screen, never while a session or kick count is open (plan §6: "never mid-session"),
 * and never before the disclaimer was acknowledged (`startAds` itself refuses). So the consent form can never sit on top of the button.
 */
export function useStartAdsWhenSafe() {
  const done = useOnboardingComplete();
  const acked = useMeta((s) => s.meta.disclaimerAckAt !== undefined);
  const pathname = usePathname();
  const sessionOpen = useSessions((s) => s.active !== null);
  const kickOpen = useKicks((s) => s.active !== null);
  useEffect(() => {
    if (done && acked && !isTimerButtonScreen(pathname) && !sessionOpen && !kickOpen) void startAds();
  }, [done, acked, pathname, sessionOpen, kickOpen]);
}
