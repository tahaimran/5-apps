import { StyleSheet, View } from 'react-native';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';
import { IconCircle } from '@/ui/SettingsRow';

/** The disclaimer of plan §6 screen 2, always one tap away (plan F19). */
export default function Disclaimer() {
  const { colors, type, spacing } = useTheme();
  const app = useAppColors();
  return (
    <Screen stack title={t('disclaimerScreen.title')}>
      <Card style={{ gap: spacing.md }}>
        <View style={styles.row}>
          <IconCircle icon={Stethoscope} tint={app.alertIcon} bg={app.alertBg} size={48} />
        </View>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('onboarding.disclaimerBody')}</AppText>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('disclaimerScreen.general')}</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row' } });
