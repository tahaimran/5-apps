import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AdBanner } from '@shared/ads';
import { useTheme } from '@shared/theme';
import { useKicks } from '@/store/kicks';
import { useSessions } from '@/store/sessions';
import { useAds } from '@/store/ads';

/**
 * A banner under the content with 8dp above it and a divider (plan §12), only while this screen is
 * in front (a tab that is open but hidden must not hold a live banner). When there is no ad the slot
 * is empty: no divider, no gap, no blank box.
 */
export function BannerSlot({ placement }: { placement: string }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [height, setHeight] = useState(0);
  // The guard is read when the banner renders, so anything it depends on re-renders this: a session or kick count that opens, or the keyboard.
  useSessions((s) => s.active !== null);
  useKicks((s) => s.active !== null);
  useAds((s) => s.keyboardOpen);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  if (!focused) return null;
  const visible = height > 0;
  return (
    <View style={{ borderTopWidth: visible ? 1 : 0, borderTopColor: colors.border, paddingTop: visible ? 8 : 0, backgroundColor: colors.background }}>
      <View onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
        <AdBanner placement={placement} />
      </View>
    </View>
  );
}
