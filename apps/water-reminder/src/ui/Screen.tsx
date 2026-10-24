import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme';

/** A scrolling page on the app background; stack screens get their title from the native header. */
export function Screen({ children, edges = ['top'] }: { children: ReactNode; edges?: ('top' | 'bottom')[] }) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={edges}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
