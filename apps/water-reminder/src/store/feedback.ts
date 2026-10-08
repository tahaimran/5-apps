import { useMemo } from 'react';
import { useHaptics } from '@shared/theme';
import { useSettings } from './settings';

/** Haptics that respect the Settings toggle (plan §7.4: light tap on chips, success on goal, warning on delete). */
export function useFeedback() {
  const haptics = useHaptics();
  const enabled = useSettings((s) => s.prefs.haptics);
  return useMemo(
    () => ({
      tap: () => enabled && haptics.tap(),
      success: () => enabled && haptics.success(),
      warning: () => enabled && haptics.warning(),
      select: () => enabled && haptics.select(),
    }),
    [enabled, haptics],
  );
}
