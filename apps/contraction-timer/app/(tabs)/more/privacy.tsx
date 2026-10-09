import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';

const SECTIONS = ['onDevice', 'sharing', 'ads', 'notifications'] as const;

/** Plan §5.5 "Privacy & ads": what stays on the phone, what the ads involve, and (only where the law requires it) the ad choices form. */
export default function Privacy() {
  const { colors, spacing, type } = useTheme();
  const [required, setRequired] = useState(false);
  useEffect(() => {
    isPrivacyOptionsRequired().then(setRequired).catch(() => setRequired(false));
  }, []);
  const policy = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  return (
    <Screen>
      <ScreenHeader title={t('privacy.title')} />
      {SECTIONS.map((key) => (
        <AppText key={key} style={[type.bodyLarge, { color: colors.text, marginBottom: spacing.xs }]}>{t(`privacy.${key}`)}</AppText>
      ))}
      {required ? (
        <>
          <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('privacy.choices')}</AppText>
          <BigButton tall label={t('privacy.privacyChoices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />
        </>
      ) : null}
      {policy ? <BigButton variant="secondary" label={t('privacy.policy')} onPress={() => void Linking.openURL(policy)} /> : null}
    </Screen>
  );
}
