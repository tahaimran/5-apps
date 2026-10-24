import { useMemo } from 'react';
import { useHaptics } from '@shared/theme';

/**
 * Answer feedback (plan §7): a light tap on press, success or error on an answer. The Settings toggle
 * reaches every useHaptics() through setHapticsEnabled (store/settings.ts), shared controls included.
 */
export function useFeedback() {
  const haptics = useHaptics();
  return useMemo(() => ({ tap: haptics.tap, success: haptics.success, error: haptics.error }), [haptics]);
}
