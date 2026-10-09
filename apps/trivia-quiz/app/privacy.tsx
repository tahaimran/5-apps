import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';

const SECTIONS = ['onDevice', 'ads', 'notifications', 'noAccount', 'choices'] as const;

/** A plain-language summary of what the app does with data (the full policy is the hosted page). */
export default function Privacy() {
  const { spacing } = useTheme();
  return (
    <Screen>
      <AppText variant="h1" accessibilityRole="header">{t('privacy.title')}</AppText>
      {SECTIONS.map((key) => (
        <AppText key={key} variant="body" style={{ marginBottom: spacing.sm }}>{t(`privacy.${key}`)}</AppText>
      ))}
      <BigButton tall label={t('common.done')} onPress={() => router.back()} />
    </Screen>
  );
}
