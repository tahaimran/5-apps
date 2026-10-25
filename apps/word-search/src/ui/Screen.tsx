import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { IconButton } from '@shared/ui';
import { AppText } from './AppText';
import { Ribbon } from './Ribbon';
import { SkyBackdrop } from './SkyBackdrop';

export interface ScreenProps {
  children: ReactNode;
  /** Stays pinned under the content (banners). */
  footer?: ReactNode;
  /** A gold ribbon at the top of a tab screen, or the header title of a pushed screen. */
  title?: string;
  /** Something on the right of a pushed screen's title (icon buttons). */
  titleAccessory?: ReactNode;
  /** A pushed screen: a back button beside the title instead of the ribbon. */
  stack?: boolean;
  /**
   * Shown outside the tabs (a pushed screen or a modal on the root stack): no tab bar takes the bottom
   * safe area, so the screen pads for it (content would otherwise run under the system navigation bar).
   */
  modal?: boolean;
  onBack?: () => void;
  /** Drawn behind everything instead of the plain sky (Home's scene). */
  backdrop?: ReactNode;
}

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** A scrolling screen on the sky with the 16dp gutter (plan §7.3). */
export function Screen({ children, footer, title, titleAccessory, stack, modal, onBack, backdrop }: ScreenProps) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={modal ? ['top', 'bottom'] : ['top']}>
      {backdrop ?? <SkyBackdrop />}
      {stack || modal ? <StackHeader title={title} onBack={onBack} accessory={titleAccessory} /> : null}
      {/* Clipped at its own top edge: scrolled content must slide under the status bar, never draw over it. */}
      <ScrollView
        style={styles.clip}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, paddingTop: stack || modal ? spacing.xs : spacing.lg, gap: spacing.md, flexGrow: 1 }}
      >
        {!stack && !modal && title ? <Ribbon title={title} /> : null}
        {children}
      </ScrollView>
      {footer ? <View>{footer}</View> : null}
    </SafeAreaView>
  );
}

/** A round back button and the title of a pushed screen. */
export function StackHeader({ title, onBack, accessory }: { title?: string; onBack?: () => void; accessory?: ReactNode }) {
  const { colors, spacing, type, shadow, mode } = useTheme();
  return (
    <View style={[styles.header, { paddingHorizontal: spacing.sm, gap: spacing.sm }]}>
      <IconButton
        icon={ChevronLeft}
        label={t('game.back')}
        onPress={onBack ?? goBack}
        size={26}
        style={[{ backgroundColor: colors.surface }, mode === 'high-contrast' ? { borderWidth: 2, borderColor: colors.border } : shadow(1)]}
      />
      {title ? (
        <AppText accessibilityRole="header" style={[type.title, styles.flex, { color: colors.text, fontWeight: '800' }]}>
          {title}
        </AppText>
      ) : (
        <View style={styles.flex} />
      )}
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
});
