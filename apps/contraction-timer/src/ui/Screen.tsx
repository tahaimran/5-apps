import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme';

/**
 * A scrolling screen with the 20dp gutter (plan §7); `footer` stays pinned under the content (banners).
 * `scrollEnabled` is switched off while a finger is on a big button, so a slightly sliding thumb cannot
 * turn the tap into a scroll.
 */
export function Screen({ children, footer, scrollEnabled = true }: { children: ReactNode; footer?: ReactNode; scrollEnabled?: boolean }) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={{ padding: spacing.xl - 4, gap: spacing.md, flexGrow: 1 }}>
        {children}
      </ScrollView>
      {footer ? <View>{footer}</View> : null}
    </SafeAreaView>
  );
}
