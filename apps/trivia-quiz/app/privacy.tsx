import { StyleSheet, View } from 'react-native';
import Bell from 'lucide-react-native/icons/bell';
import Megaphone from 'lucide-react-native/icons/megaphone';
import Settings2 from 'lucide-react-native/icons/settings-2';
import Smartphone from 'lucide-react-native/icons/smartphone';
import UserX from 'lucide-react-native/icons/user-x';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card, type IconComponent } from '@shared/ui';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';
import { IconCircle } from '@/ui/SettingsRow';

const SECTIONS: [key: string, icon: IconComponent][] = [
  ['onDevice', Smartphone],
  ['ads', Megaphone],
  ['notifications', Bell],
  ['noAccount', UserX],
  ['choices', Settings2],
];

/** A plain-language summary of what the app does with data (the full policy is the hosted page). */
export default function Privacy() {
  const { spacing } = useTheme();
  return (
    <Screen stack title={t('privacy.title')}>
      <Card style={{ gap: spacing.lg }}>
        {SECTIONS.map(([key, icon]) => (
          <View key={key} style={[styles.row, { gap: spacing.md }]}>
            <IconCircle icon={icon} />
            <AppText variant="body" style={styles.flex}>
              {t(`privacy.${key}`)}
            </AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-start' }, flex: { flex: 1 } });
