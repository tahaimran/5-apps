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
  /** Something on the right of the title (icon buttons). */
  titleAccessory?: ReactNode;
  /** A pushed screen: a back button beside the title instead of the big tab title. */
  stack?: boolean;
  /**
   * Shown outside the tabs (a modal on the root stack): no tab bar takes the bottom safe area, so the
   * screen pads for it (content would otherwise run under the system navigation bar).
   */
  modal?: boolean;
  onBack?: () => void;
  /** Switched off while a finger is on a big button, so a sliding thumb cannot turn a tap into a scroll. */
  scrollEnabled?: boolean;
  /** Drawn behind everything (the Timer's wash); the page background stays the theme's. */
  backdrop?: ReactNode;
}

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** A scrolling screen with the 20dp gutter (plan §7). */
export function Screen({ children, footer, title, titleAccessory, stack, modal, onBack, scrollEnabled = true, backdrop }: ScreenProps) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={modal ? ['top', 'bottom'] : ['top']}>
      {backdrop}
      {stack || modal ? <StackHeader title={title} onBack={onBack} accessory={titleAccessory} /> : null}
      <ScrollView
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.xl - 4, paddingTop: stack || modal ? spacing.xs : spacing.lg, gap: spacing.md, flexGrow: 1 }}
      >
        {!stack && !modal && title ? <TabTitle title={title} accessory={titleAccessory} /> : null}
        {children}
      </ScrollView>
      {footer ? <View>{footer}</View> : null}
    </SafeAreaView>
  );
}

/** A back button and the title of a pushed screen (also used above lists). */
export function StackHeader({ title, onBack, accessory }: { title?: string; onBack?: () => void; accessory?: ReactNode }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={[styles.header, { paddingHorizontal: spacing.sm, gap: spacing.xs }]}>
      <IconButton icon={ChevronLeft} label={t('common.back')} onPress={onBack ?? goBack} />
      {title ? (
        <AppText accessibilityRole="header" style={[type.title, styles.flex, { color: colors.text, fontWeight: '800' }]}>
          {title}
        </AppText>
      ) : null}
      {accessory}
    </View>
  );
}

/** The big title of a tab screen, with room for icon buttons on the right. */
export function TabTitle({ title, accessory }: { title: string; accessory?: ReactNode }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={[styles.titleRow, { gap: spacing.sm }]}>
      <AppText accessibilityRole="header" style={[type.headline, styles.flex, { color: colors.text, fontWeight: '800' }]}>
        {title}
      </AppText>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  titleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, flexWrap: 'wrap' },
});
