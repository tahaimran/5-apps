import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'timer';

/**
 * Plan F6: the screen stays on while a session is open and the Timer screen is in front, and is released
 * otherwise (leaving the screen, ending the session, closing the app). Only expo-keep-awake is used.
 */
export function useKeepAwakeWhile(on: boolean) {
  useEffect(() => {
    if (!on) return undefined;
    void activateKeepAwakeAsync(TAG).catch(() => undefined);
    return () => {
      void deactivateKeepAwake(TAG).catch(() => undefined);
    };
  }, [on]);
}
