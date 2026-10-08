import { Text } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Screen } from '@/ui/Screen';

export default function Stats() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('tabs.stats')}</Text>
      <Text style={[type.body, { color: colors.textMuted }]}>{t('stats.empty')}</Text>
    </Screen>
  );
}
