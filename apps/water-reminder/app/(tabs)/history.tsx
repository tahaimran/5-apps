import { Text } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Screen } from '@/ui/Screen';

/** Placeholder until this screen is built (milestones 3, 5 and 6). */
export default function Tab() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>
        {t('tabs.history')}
      </Text>
    </Screen>
  );
}
