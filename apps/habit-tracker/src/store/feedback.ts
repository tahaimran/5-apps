import { useMemo } from 'react';
import { playSound } from '@shared/sound';
import { useHaptics } from '@shared/theme';
import { useSettings } from './settings';

/**
 * Haptics plus a UI sound per user action, each respecting its Settings toggle. One call per
 * action, fired in the same frame as the visual change (never as the only feedback).
 */
export function useFeedback() {
  const haptics = useHaptics();
  const hapticsOn = useSettings((s) => s.settings.haptics);
  const soundsOn = useSettings((s) => s.settings.sounds);
  return useMemo(
    () => ({
      /** A step toward a goal: +1, timer started, a few minutes added. */
      check: () => {
        if (hapticsOn) haptics.tap();
        if (soundsOn) playSound('tap');
      },
      /** A yes/no habit checked off. */
      done: () => {
        if (hapticsOn) haptics.success();
        if (soundsOn) playSound('check');
      },
      /** A count or timer reached its target. */
      complete: () => {
        if (hapticsOn) haptics.success();
        if (soundsOn) playSound('complete');
      },
      undo: () => {
        if (hapticsOn) haptics.select();
        if (soundsOn) playSound('undo');
      },
      /** Rare wins: perfect day, streak milestones, first check-in. */
      celebrate: () => {
        if (hapticsOn) haptics.success();
        if (soundsOn) playSound('celebrate');
      },
    }),
    [hapticsOn, soundsOn, haptics],
  );
}
