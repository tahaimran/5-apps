import { isRewardedReady, showRewarded } from '@shared/ads';
import { markInterruption } from '@/ads/guard';
import { dayKeyFor } from '@/domain/dayKey';
import { freezeBlock, unlockKey, unlocksLeftToday, type FreezeBlock, type ShopKind } from '@/domain/rewards';
import { addFreeze } from '@/domain/streak';
import { useSettings } from '@/store/settings';
import { useWater } from '@/store/water';

const today = () => dayKeyFor(new Date(), useSettings.getState().reminders.wakeMin);

export type RewardResult = 'earned' | 'unavailable' | 'cancelled' | FreezeBlock | 'limit';

/** Whether a streak freeze can be earned now, and why not. */
export const freezeStatus = (): FreezeBlock | null => freezeBlock(useWater.getState().progress, useSettings.getState().prefs, today());
export const unlocksLeft = (): number => unlocksLeftToday(useSettings.getState().prefs, today());
export const rewardedReady = (placement: 'streak_freeze' | 'garden_unlock_skin'): boolean => isRewardedReady(placement);

/**
 * "Watch an ad, keep your streak" (plan §12): user-initiated, one freeze a day, two at most.
 * The freeze is only granted when the SDK reports the reward as earned.
 */
export async function earnFreeze(): Promise<RewardResult> {
  const block = freezeStatus();
  if (block) return block;
  const { rewarded } = await showRewarded('streak_freeze');
  markInterruption();
  if (!rewarded) return 'unavailable';
  const water = useWater.getState();
  water.setProgress({ streakFreezes: addFreeze(water.progress).streakFreezes });
  useSettings.getState().setPrefs({ freezeEarnedDay: today() });
  return 'earned';
}

/** "Watch ad to unlock" a skin or cup theme: at most 10 a day, and only on a granted reward. */
export async function unlockWithAd(kind: ShopKind, id: string): Promise<RewardResult> {
  if (unlocksLeft() <= 0) return 'limit';
  const { rewarded } = await showRewarded('garden_unlock_skin');
  markInterruption();
  if (!rewarded) return 'unavailable';
  const water = useWater.getState();
  const key = unlockKey(kind, id);
  if (!water.progress.unlocked.includes(key)) water.setProgress({ unlocked: [...water.progress.unlocked, key] });
  const { prefs, setPrefs } = useSettings.getState();
  const day = today();
  setPrefs({ unlocksToday: { day, count: (prefs.unlocksToday?.day === day ? prefs.unlocksToday.count : 0) + 1 } });
  return 'earned';
}

export function equip(kind: ShopKind, id: string): void {
  useWater.getState().setProgress(kind === 'skin' ? { activeSkin: id } : { activeCupTheme: id });
}
