import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { SystemNavBar } from '@shared/ui';
import { useAppColors } from '@/theme/mode';
import { AppText } from './AppText';

/**
 * A bottom sheet (the platform's own slide). Tapping outside, or the system Back button, closes it.
 * It draws under the system navigation bar, pads for it, and keeps its buttons readable on the sheet.
 */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const { colors, radius, spacing, shadow, type, mode } = useTheme();
  const app = useAppColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <SystemNavBar dark={mode !== 'light'} />
      <View style={[styles.scrim, { backgroundColor: app.scrim }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={styles.flex} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }, shadow(3)]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ScrollView contentContainerStyle={{ padding: spacing.xl - 4, paddingTop: spacing.md, paddingBottom: spacing.lg + insets.bottom, gap: spacing.md }}>
            {title ? (
              <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800' }]}>
                {title}
              </AppText>
            ) : null}
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: 10 },
});
