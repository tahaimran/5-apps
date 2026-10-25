import { useMemo } from 'react';
import { haptics } from '@shared/theme';

/**
 * Haptics (plan §7.4) through the shared helpers, which follow the Settings toggle (pushed with
 * setHapticsEnabled by the settings store) and fire in the same tick as the visual: a selection tick
 * when a selection starts, success when a word is found, success then a medium bump 150 ms later when
 * the puzzle is complete. Nothing for an invalid selection.
 */
export function useFeedback() {
  return useMemo(
    () => ({
      tap: () => void haptics.tap(),
      select: () => void haptics.select(),
      success: () => void haptics.success(),
      complete: () => {
        void haptics.success();
        setTimeout(() => void haptics.press(), 150);
      },
    }),
    [],
  );
}
