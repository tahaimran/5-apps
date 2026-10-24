import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

/**
 * A bottom sheet (the platform's own slide). Tapping outside, or the system Back button, closes it.
 * It pads for the system navigation bar so its buttons never sit under it.
 */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { colors, radius, spacing, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.scrim}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={styles.flex} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }, shadow(3)]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg + insets.bottom, gap: spacing.md }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,8,36,0.55)' },
  sheet: { maxHeight: '88%' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: 10 },
});
