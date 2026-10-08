import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

export default function Settings() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>
        {t('settings.title')}
      </AppText>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('common.comingSoon')}</AppText>
    </Screen>
  );
}
