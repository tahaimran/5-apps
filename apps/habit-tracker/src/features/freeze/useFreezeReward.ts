import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { showRewarded } from '@shared/ads';
import { t } from '@shared/i18n';
import { markRewardedShown } from '@/ads/guard';
import { canEarnFromAd, MAX_FREEZES } from '@/domain/freezes';
import { useHabits } from '@/store/habits';
import { useToday } from '@/store/today';

/**
 * "Watch an ad to earn a freeze" (plan §12): opt-in, the button says what you get, and the
 * reward is granted only when the ad reports it was earned. One a day, at most two held.
 */
export function useFreezeReward() {
  const freezes = useHabits((s) => s.freezes);
  const earnFreeze = useHabits((s) => s.earnFreeze);
  const today = useToday((s) => s.today);
  const [busy, setBusy] = useState(false);

  const can = canEarnFromAd(freezes, today);
  const blockedReason: 'full' | 'daily' | null = can ? null : freezes.count >= MAX_FREEZES ? 'full' : 'daily';

  const earn = useCallback(async () => {
    if (!can || busy) return;
    setBusy(true);
    try {
      const { rewarded } = await showRewarded('streak_freeze');
      markRewardedShown();
      if (rewarded && earnFreeze(today)) Alert.alert(t('freeze.title'), t('freeze.earned'));
      else if (!rewarded) Alert.alert(t('freeze.title'), t('freeze.unavailable'));
    } finally {
      setBusy(false);
    }
  }, [can, busy, earnFreeze, today]);

  return { count: freezes.count, can, blockedReason, busy, earn };
}
