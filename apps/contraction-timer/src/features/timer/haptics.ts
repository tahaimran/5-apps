import * as Haptics from 'expo-haptics';
import { useSettings } from '@/store/settings';

const enabled = () => useSettings.getState().settings.haptics;

/** Runs a haptic and swallows any failure: feedback must never break a tap. */
const fire = (go: () => Promise<void> | void) => {
  try {
    void Promise.resolve(go()).catch(() => undefined);
  } catch {
    // no vibrator, or the call is not supported on this phone
  }
};

/** Plan §7: start = heavy, stop = medium twice, banner = warning, kick tap = light. All of it follows the Settings switch. */
export const timerHaptics = {
  start: () => {
    if (enabled()) fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },
  stop: () => {
    if (!enabled()) return;
    fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    setTimeout(() => {
      if (enabled()) fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    }, 140);
  },
  banner: () => {
    if (enabled()) fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  kick: () => {
    if (enabled()) fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
};
