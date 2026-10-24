import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { IconButton } from '@shared/ui';
import { AppText } from './AppText';

export interface ScreenProps {
  children: ReactNode;
  /** Stays pinned under the content (banners). */
  footer?: ReactNode;
  /** A big title at the top of a tab screen, or the header title of a pushed screen. */
  title?: string;
  /** Something on the right of a tab screen's title (a streak chip). */
  titleAccessory?: ReactNode;
  /**
   * A pushed (stack) screen: a back button beside the title, and the bottom safe area, since no tab
   * bar takes it (content would otherwise run under the system navigation bar).
   */
  stack?: boolean;
  onBack?: () => void;
}

/** A scrolling screen with the 16dp gutter; tab screens get a big title, pushed screens a back header. */
export function Screen({ children, footer, title, titleAccessory, stack, onBack }: ScreenProps) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={stack ? ['top', 'bottom'] : ['top']}>
      {stack ? (
        <View style={[styles.header, { paddingHorizontal: spacing.sm, gap: spacing.xs }]}>
          <IconButton icon={ChevronLeft} label={t('common.back')} onPress={onBack ?? (() => router.back())} />
          {title ? (
            <AppText variant="h2" accessibilityRole="header" numberOfLines={1} style={styles.flex}>
              {title}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: stack ? spacing.sm : spacing.lg, gap: spacing.md }}>
        {!stack && title ? (
          <View style={[styles.titleRow, { gap: spacing.md }]}>
            <AppText variant="h1" accessibilityRole="header" style={styles.flex}>
              {title}
            </AppText>
            {titleAccessory}
          </View>
        ) : null}
        {children}
      </ScrollView>
      {footer ? <View>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  titleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
});
