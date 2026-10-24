import { Linking, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Device from 'expo-device';
import * as IntentLauncher from 'expo-intent-launcher';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { dontKillMyAppUrl, vendorOf } from '@/domain/battery';
import { Screen } from '@/ui/Screen';
import { PrimaryButton, TextButton } from '@/ui/controls';

const STEPS = [1, 2, 3] as const;

export default function BatteryGuide() {
  const { colors, spacing, type, fonts } = useTheme();
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
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t('settings.battery'), headerShown: true }} />
      <Text style={[type.body, { color: colors.textMuted }]}>{t('battery.intro')}</Text>
      <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800' }]}>
        {t(`battery.vendor.${vendor}`)}
      </Text>
      <Card style={{ gap: spacing.lg }}>
        {STEPS.map((n) => (
          <View key={n} style={[styles.step, { gap: spacing.md }]}>
            <View style={[styles.num, { backgroundColor: colors.primarySoft }]}>
              <Text style={[type.body, { color: colors.primary, fontWeight: '800', fontFamily: fonts.display }]}>{n}</Text>
            </View>
            <Text style={[type.bodyLarge, styles.flex, { color: colors.text }]}>{t(`battery.steps.${vendor}.${n}`)}</Text>
          </View>
        ))}
      </Card>
      <PrimaryButton label={t('battery.open')} onPress={() => void openSettings()} />
      <TextButton label={t('battery.more')} onPress={() => void Linking.openURL(dontKillMyAppUrl(vendor))} />
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('battery.note')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  num: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
