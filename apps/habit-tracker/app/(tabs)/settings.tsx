import { Text } from 'react-native';
import Constants from 'expo-constants';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Screen } from '@/ui/Screen';

export default function Settings() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('settings.title')}</Text>
      <Text style={[type.body, { color: colors.textMuted }]}>
        {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </Screen>
  );
}
