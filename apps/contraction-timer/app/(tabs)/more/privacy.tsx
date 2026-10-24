import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Bell from 'lucide-react-native/icons/bell';
import ExternalLink from 'lucide-react-native/icons/external-link';
import Megaphone from 'lucide-react-native/icons/megaphone';
import Share2 from 'lucide-react-native/icons/share-2';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Smartphone from 'lucide-react-native/icons/smartphone';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, type IconComponent } from '@shared/ui';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';
import { IconCircle } from '@/ui/SettingsRow';

const SECTIONS: { key: 'onDevice' | 'sharing' | 'ads' | 'notifications'; icon: IconComponent }[] = [
  { key: 'onDevice', icon: Smartphone },
  { key: 'sharing', icon: Share2 },
  { key: 'ads', icon: Megaphone },
  { key: 'notifications', icon: Bell },
];

/** Plan §5.5 "Privacy & ads": what stays on the phone, what the ads involve, and (only where the law requires it) the ad choices form. */
export default function Privacy() {
  const { colors, spacing, type } = useTheme();
  const [required, setRequired] = useState(false);
  useEffect(() => {
    isPrivacyOptionsRequired().then(setRequired).catch(() => setRequired(false));
  }, []);
  const policy = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  return (
    <Screen stack title={t('privacy.title')}>
      {SECTIONS.map(({ key, icon }) => (
        <Card key={key} style={[styles.row, { gap: spacing.md }]}>
          <IconCircle icon={icon} />
          <AppText style={[type.bodyLarge, styles.flex, { color: colors.text }]}>{t(`privacy.${key}`)}</AppText>
        </Card>
      ))}
      {required ? (
        <Card style={{ gap: spacing.md }}>
          <View style={[styles.row, { gap: spacing.md }]}>
            <IconCircle icon={ShieldCheck} />
            <AppText style={[type.bodyLarge, styles.flex, { color: colors.text }]}>{t('privacy.choices')}</AppText>
          </View>
          <Button icon={SlidersHorizontal} label={t('privacy.privacyChoices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />
        </Card>
      ) : null}
      {policy ? <Button variant="secondary" icon={ExternalLink} label={t('privacy.policy')} onPress={() => void Linking.openURL(policy)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
});
