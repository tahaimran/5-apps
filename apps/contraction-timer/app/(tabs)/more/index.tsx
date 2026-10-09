import { Alert, Linking, Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { deleteAllData } from '@/features/settings/reset';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';

const PACKAGE = (Constants.expoConfig?.android?.package as string | undefined) ?? 'com.fiveapps.contractiontimer';
const contactEmail = () => process.env.EXPO_PUBLIC_CONTACT_EMAIL;

/** Opens the Play Store page; the web page is the fallback when the Store app is missing. */
export const rateApp = async () => {
  try {
    await Linking.openURL(`market://details?id=${PACKAGE}`);
  } catch {
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${PACKAGE}`).catch(() => undefined);
  }
};

/** Opens the mail app with the version and Android version filled in (nothing else about the phone, and no health data). */
export const sendFeedback = async () => {
  const email = contactEmail();
  if (!email) return;
  const body = t('more.feedbackBody', { version: Constants.expoConfig?.version ?? '', android: String(Platform.Version) });
  await Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(t('more.feedbackSubject'))}&body=${encodeURIComponent(body)}`).catch(() => undefined);
};

/** Plan §5.5, with the two-step confirmation for deleting everything. */
export function confirmDeleteAll(onDone?: () => void): void {
  Alert.alert(t('more.deleteTitle'), t('more.deleteBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('more.deleteContinue'),
      style: 'destructive',
      onPress: () =>
        Alert.alert(t('more.deleteSureTitle'), t('more.deleteSureBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('more.deleteConfirm'),
            style: 'destructive',
            onPress: () => {
              void deleteAllData().finally(() => {
                onDone?.();
                router.replace('/');
              });
            },
          },
        ]),
    },
  ]);
}

export default function More() {
  const { colors, spacing, type } = useTheme();
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>{t('more.title')}</AppText>
      <View style={{ gap: spacing.sm }}>
        <BigButton variant="secondary" label={t('more.settings')} onPress={() => router.push('/more/settings')} />
        <BigButton variant="secondary" label={t('more.privacy')} onPress={() => router.push('/more/privacy')} />
        <BigButton variant="secondary" label={t('more.disclaimer')} onPress={() => router.push('/more/disclaimer')} />
        <BigButton variant="secondary" label={t('more.rate')} onPress={() => void rateApp()} />
        {contactEmail() ? <BigButton variant="secondary" label={t('more.feedback')} onPress={() => void sendFeedback()} /> : null}
        <BigButton variant="secondary" label={t('more.about')} onPress={() => router.push('/more/about')} />
        {__DEV__ ? <BigButton variant="secondary" label={t('more.adRules')} onPress={() => router.push('/debug-ads')} /> : null}
      </View>
      <View style={{ marginTop: spacing.xl }}>
        <BigButton variant="danger" label={t('more.delete')} onPress={() => confirmDeleteAll()} />
      </View>
    </Screen>
  );
}
