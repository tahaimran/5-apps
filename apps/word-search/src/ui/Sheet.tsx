import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

/** A bottom sheet. Tapping outside, or the system Back button, closes it. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={{ flex: 1 }} />
        <View style={{ maxHeight: '85%', backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
