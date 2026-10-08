import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

/** Placeholder until the onboarding and Today screens land (milestones 2 and 3). */
export default function Index() {
  const { colors, type } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>
        {t('app.name')}
      </Text>
    </SafeAreaView>
  );
}
