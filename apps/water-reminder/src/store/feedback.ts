import { useMemo } from 'react';
import { playSound } from '@shared/sound';
import { useHaptics } from '@shared/theme';
import { useSettings } from './settings';

/**
 * Haptics plus a UI sound per user action, each respecting its Settings toggle (plan §7.4). One call
 * per action, fired in the same frame as the visual change (never as the only feedback).
 */
export function useFeedback() {
  const haptics = useHaptics();
  const hapticsOn = useSettings((s) => s.prefs.haptics);
  const soundsOn = useSettings((s) => s.prefs.sounds);
  return useMemo(
    () => ({
      /** A drink logged. */
      add: () => {
        if (hapticsOn) void haptics.tap();
        if (soundsOn) playSound('check');
      },
      /** The daily goal reached, a plant stage unlocked. */
      celebrate: () => {
        if (hapticsOn) void haptics.success();
        if (soundsOn) playSound('celebrate');
      },
      undo: () => {
        if (hapticsOn) void haptics.select();
        if (soundsOn) playSound('undo');
      },
      /** A small confirmation: saved, unlocked, chip picked. */
      tap: () => {
        if (hapticsOn) void haptics.tap();
      },
      select: () => {
        if (hapticsOn) void haptics.select();
      },
      success: () => {
        if (hapticsOn) void haptics.success();
        if (soundsOn) playSound('complete');
      },
      /** Delete. */
      warning: () => {
        if (hapticsOn) void haptics.warning();
      },
    }),
    [hapticsOn, soundsOn, haptics],
  );
}
