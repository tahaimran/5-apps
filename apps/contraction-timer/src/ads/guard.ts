import { useEffect } from 'react';
import { setAdGuard } from '@shared/ads';

/**
 * Milestone 1 only: until the real rules of plan §12 are installed (milestone 8), the app-level veto refuses
 * every banner, native, interstitial and app-open request, so no ad can appear anywhere by accident.
 */
export function installAdGuard(): () => void {
  setAdGuard(() => false);
  return () => setAdGuard(null);
}

export function useAdGuard() {
  useEffect(() => installAdGuard(), []);
}
