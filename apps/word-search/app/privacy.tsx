import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { GameButton } from '@/ui/GameButton';
import { Screen } from '@/ui/Screen';

const SECTIONS = ['onDevice', 'ads', 'notifications', 'noAccount', 'choices'] as const;

/** A plain-language summary of what the app does with data (the full policy is the hosted page). */
export default function Privacy() {
  const { colors, spacing, type } = useTheme();
  return (
    <Screen modal title={t('privacy.title')}>
      {SECTIONS.map((key) => (
        <AppText key={key} style={[type.bodyLarge, { color: colors.text, marginBottom: spacing.sm }]}>{t(`privacy.${key}`)}</AppText>
      ))}
      <GameButton label={t('common.done')} onPress={() => router.back()} />
    </Screen>
  );
}
