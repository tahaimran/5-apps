import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import { requestPinWidget } from 'react-native-android-widget';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button } from '@shared/ui';
import { WIDGET_NAME } from '@/widget/render';

/** After the first check-in: offers to pin the widget (the app's hero feature). */
export function WidgetPromptSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, spacing, radius, type } = useTheme();
  const insets = useSafeAreaInsets();

  const show = async () => {
    onClose();
    const supported = await requestPinWidget({ widgetName: WIDGET_NAME }).catch(() => false);
    if (!supported) Alert.alert(t('widgetSheet.title'), `${t('settings.widgetUnsupported')} ${t('settings.widgetHow')}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable accessibilityLabel={t('common.close')} style={styles.scrim} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: spacing.xl + insets.bottom, gap: spacing.md },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <View style={[styles.art, { backgroundColor: colors.primarySoft }]}>
          <LayoutGrid size={32} color={colors.primary} strokeWidth={2} />
        </View>
        <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{t('widgetSheet.title')}</Text>
        <Text style={[type.bodyLarge, { color: colors.textMuted }]}>{t('widgetSheet.body')}</Text>
        <Button label={t('widgetSheet.show')} onPress={show} style={{ marginTop: spacing.sm }} />
        <Button label={t('widgetSheet.later')} variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#0000007A' },
  sheet: {},
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: -8, marginBottom: 8 },
  art: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
