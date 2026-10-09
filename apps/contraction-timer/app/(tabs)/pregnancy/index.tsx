import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

export default function PregnancyHome() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>
        {t('pregnancy.title')}
      </AppText>
    </Screen>
  );
}
