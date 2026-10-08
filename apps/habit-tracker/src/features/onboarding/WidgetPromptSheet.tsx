import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { requestPinWidget } from 'react-native-android-widget';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { WIDGET_NAME } from '@/widget/render';
import { PrimaryButton, TextButton } from '@/ui/controls';

/** After the first check-in: offers to pin the widget (the app's hero feature). */
export function WidgetPromptSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, spacing, radius, type } = useTheme();

  const show = async () => {
    onClose();
    const supported = await requestPinWidget({ widgetName: WIDGET_NAME }).catch(() => false);
    if (!supported) Alert.alert(t('widgetSheet.title'), `${t('settings.widgetUnsupported')} ${t('settings.widgetHow')}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel={t('common.close')} style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.md }]}>
        <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('widgetSheet.title')}</Text>
        <Text style={[type.bodyLarge, { color: colors.textMuted }]}>{t('widgetSheet.body')}</Text>
        <PrimaryButton label={t('widgetSheet.show')} onPress={show} />
        <TextButton label={t('widgetSheet.later')} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#00000066' },
  sheet: {},
});
