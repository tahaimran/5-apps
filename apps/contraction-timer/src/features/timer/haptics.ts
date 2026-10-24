import { playSound } from '@shared/sound';
import { haptics } from '@shared/theme';

/** Plan §7: stop is two medium taps this far apart. */
export const STOP_GAP_MS = 140;

/**
 * Plan §7: start = heavy, stop = medium twice, banner = warning, kick tap = light. Haptics are the main
 * feedback and follow the Settings switch (`setHapticsEnabled`, pushed by the settings store); a sound
 * plays as well only when the person turned sounds on (off by default: someone may be asleep nearby).
 * A failing vibrator or audio module never breaks a tap.
 */
export const timerHaptics = {
  start: () => {
    void haptics.heavy();
    playSound('tap');
  },
  stop: () => {
    void haptics.press();
    setTimeout(() => void haptics.press(), STOP_GAP_MS);
    playSound('check');
  },
  banner: () => {
    void haptics.warning();
  },
  kick: () => {
    void haptics.tap();
    playSound('tap');
  },
  /** The kick that reaches the target: the same Light tap (plan §7), with the complete sound instead of the tap sound. */
  kickTarget: () => {
    void haptics.tap();
    playSound('complete');
  },
  undo: () => {
    void haptics.select();
    playSound('undo');
  },
};
