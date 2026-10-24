import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import FileText from 'lucide-react-native/icons/file-text';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Smartphone from 'lucide-react-native/icons/smartphone';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { extraColorsFor } from '@/theme/tokens';
import { Screen } from '@/ui/Screen';
import { IconCircle, NavRow, SettingsGroup } from '@/ui/SettingsRow';

export default function Privacy() {
  const { colors, spacing, type, mode } = useTheme();
  const [required, setRequired] = useState(false);
  useEffect(() => {
    isPrivacyOptionsRequired().then(setRequired).catch(() => setRequired(false));
  }, []);
  // Literal env reference so Expo inlines it at build time.
  const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  const extra = extraColorsFor(mode);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('settings.privacy'), headerShown: true }} />
      <Card style={{ gap: spacing.md }}>
        <View style={styles.head}>
          <IconCircle icon={Smartphone} tint={colors.success} bg={extra.leafSoft} />
          <Text style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '600' }]}>{t('privacy.onDevice')}</Text>
        </View>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('privacy.ads')}</Text>
      </Card>
      {(required || privacyPolicyUrl) && (
        <SettingsGroup>
          {required ? <NavRow icon={ShieldCheck} label={t('privacy.choices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} /> : null}
          {privacyPolicyUrl ? <NavRow icon={FileText} label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(privacyPolicyUrl)} /> : null}
        </SettingsGroup>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
