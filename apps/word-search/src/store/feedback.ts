import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useHaptics } from '@shared/theme';
import { useSettings } from './settings';

/**
 * Haptics that respect the Settings toggle (plan §7.4): a selection tick when a selection starts,
 * success when a word is found, success then a medium bump 150 ms later when the puzzle is complete.
 * Nothing for an invalid selection.
 */
export function useFeedback() {
  const haptics = useHaptics();
  const enabled = useSettings((s) => s.settings.haptics);
  return useMemo(
    () => ({
      tap: () => enabled && haptics.tap(),
      select: () => enabled && haptics.select(),
      success: () => enabled && haptics.success(),
      complete: () => {
        if (!enabled) return;
        haptics.success();
        setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
      },
    }),
    [enabled, haptics],
  );
}
