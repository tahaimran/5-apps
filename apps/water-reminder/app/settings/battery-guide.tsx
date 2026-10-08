import { Linking, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Device from 'expo-device';
import * as IntentLauncher from 'expo-intent-launcher';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { dontKillMyAppUrl, vendorOf } from '@/domain/battery';
import { Screen } from '@/ui/Screen';
import { PrimaryButton, TextButton } from '@/ui/controls';

const STEPS = [1, 2, 3] as const;

export default function BatteryGuide() {
  const { colors, spacing, radius, type } = useTheme();
  const vendor = vendorOf(Device.manufacturer);

  // Plan §10.5: we never ask for the exempt-from-battery-optimization permission (Play policy);
  // we open the system screen and let the user decide.
  const openSettings = async () => {
    try {
      await IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    } catch {
      await Linking.openSettings();
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.battery'), headerShown: true }} />
      <Text style={[type.body, { color: colors.textMuted }]}>{t('battery.intro')}</Text>
      <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800' }]}>
        {t(`battery.vendor.${vendor}`)}
      </Text>
      <View style={{ gap: spacing.sm }}>
        {STEPS.map((n) => (
          <View key={n} style={{ flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg }}>
            <Text style={[type.bodyLarge, { color: colors.primary, fontWeight: '800' }]}>{n}</Text>
            <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{t(`battery.steps.${vendor}.${n}`)}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton label={t('battery.open')} onPress={() => void openSettings()} />
      <TextButton label={t('battery.more')} onPress={() => void Linking.openURL(dontKillMyAppUrl(vendor))} />
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('battery.note')}</Text>
    </Screen>
  );
}
