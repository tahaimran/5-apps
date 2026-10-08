import { Text } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Screen } from '@/ui/Screen';

export default function Today() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('tabs.today')}</Text>
      <Text style={[type.title, { color: colors.text }]}>{t('today.emptyTitle')}</Text>
      <Text style={[type.body, { color: colors.textMuted }]}>{t('today.emptyBody')}</Text>
    </Screen>
  );
}
