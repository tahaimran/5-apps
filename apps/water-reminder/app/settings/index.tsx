import { Text } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Screen } from '@/ui/Screen';

/** Placeholder until the settings screens land (milestone 6). */
export default function Settings() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>
        {t('settings.title')}
      </Text>
    </Screen>
  );
}
