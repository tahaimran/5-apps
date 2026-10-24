import { useEffect } from 'react';
import { KeepAwake } from '@/native/optional';

const TAG = 'timer';

/**
 * Plan F6: the screen stays on while a session is open and the Timer screen is in front, and is released
 * otherwise (leaving the screen, ending the session, closing the app). Only expo-keep-awake is used; a
 * build without it (a preview client) simply lets the screen sleep.
 */
export function useKeepAwakeWhile(on: boolean) {
  useEffect(() => {
    const lock = KeepAwake;
    if (!on || !lock) return undefined;
    void lock.activateKeepAwakeAsync(TAG).catch(() => undefined);
    return () => {
      void lock.deactivateKeepAwake(TAG).catch(() => undefined);
    };
  }, [on]);
}
