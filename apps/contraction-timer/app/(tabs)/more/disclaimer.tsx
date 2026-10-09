import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';

/** The disclaimer of plan §6 screen 2, always one tap away (plan F19). */
export default function Disclaimer() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <ScreenHeader title={t('disclaimerScreen.title')} />
      <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('onboarding.disclaimerBody')}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('disclaimerScreen.general')}</AppText>
    </Screen>
  );
}
