import { useMemo } from 'react';
import { useHaptics } from '@shared/theme';
import { useSettings } from './settings';

/** Haptics that respect the Settings toggle. */
export function useFeedback() {
  const haptics = useHaptics();
  const enabled = useSettings((s) => s.settings.haptics);
  return useMemo(
    () => ({
      check: () => enabled && haptics.tap(),
      complete: () => enabled && haptics.success(),
      undo: () => enabled && haptics.select(),
    }),
    [enabled, haptics],
  );
}
