import Constants from 'expo-constants';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';

export default function About() {
  const { colors, type } = useTheme();
  return (
    <Screen>
      <ScreenHeader title={t('about.title')} />
      <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('about.name')}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('about.version', { version: Constants.expoConfig?.version ?? '' })}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('about.body')}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('about.local')}</AppText>
    </Screen>
  );
}
