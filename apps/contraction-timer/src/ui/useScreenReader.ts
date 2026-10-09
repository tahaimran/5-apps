import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True while TalkBack (or another screen reader) is running; updates when it is switched on or off. */
export function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled().then((v) => alive && setOn(v)).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}
