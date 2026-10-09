import { useMemo } from 'react';
import { useHaptics } from '@shared/theme';
import { useSettings } from './settings';

/** Haptics that respect the Settings toggle (plan §7): a light tap on press, success or error on an answer. */
export function useFeedback() {
  const haptics = useHaptics();
  const enabled = useSettings((s) => s.settings.haptics);
  return useMemo(
    () => ({
      tap: () => enabled && haptics.tap(),
      success: () => enabled && haptics.success(),
      error: () => enabled && haptics.error(),
    }),
    [enabled, haptics],
  );
}
