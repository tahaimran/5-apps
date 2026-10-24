import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import Lock from 'lucide-react-native/icons/lock';
import Timer from 'lucide-react-native/icons/timer';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';
import { IconCircle } from '@/ui/SettingsRow';

export default function About() {
  const { colors, type, spacing } = useTheme();
  return (
    <Screen stack title={t('about.title')}>
      <Card style={{ gap: spacing.md }}>
        <View style={[styles.row, { gap: spacing.md }]}>
          <IconCircle icon={Timer} size={48} />
          <View style={styles.flex}>
            <AppText style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t('about.name')}</AppText>
            <AppText style={[type.body, { color: colors.textMuted }]}>{t('about.version', { version: Constants.expoConfig?.version ?? '' })}</AppText>
          </View>
        </View>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('about.body')}</AppText>
      </Card>
      <Card style={[styles.row, { gap: spacing.md, alignItems: 'flex-start' }]}>
        <IconCircle icon={Lock} />
        <AppText style={[type.bodyLarge, styles.flex, { color: colors.text }]}>{t('about.local')}</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
