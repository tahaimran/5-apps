import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme';

/** A scrolling screen with the 16dp gutter; `footer` stays pinned under the content (banners). */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>{children}</ScrollView>
      {footer ? <View>{footer}</View> : null}
    </SafeAreaView>
  );
}
