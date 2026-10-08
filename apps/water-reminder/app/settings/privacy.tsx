import { useEffect, useState } from 'react';
import { Linking, Text } from 'react-native';
import { Stack } from 'expo-router';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Screen } from '@/ui/Screen';
import { NavRow } from '@/ui/SettingsRow';

export default function Privacy() {
  const { colors, type } = useTheme();
  const [required, setRequired] = useState(false);
  useEffect(() => {
    isPrivacyOptionsRequired().then(setRequired).catch(() => setRequired(false));
  }, []);
  // Literal env reference so Expo inlines it at build time.
  const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.privacy'), headerShown: true }} />
      <Text style={[type.bodyLarge, { color: colors.text }]}>{t('privacy.onDevice')}</Text>
      <Text style={[type.body, { color: colors.textMuted }]}>{t('privacy.ads')}</Text>
      {required && <NavRow icon="shield-account-outline" label={t('privacy.choices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />}
      {privacyPolicyUrl ? <NavRow icon="file-document-outline" label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(privacyPolicyUrl)} /> : null}
    </Screen>
  );
}
