import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { clampFactor, defaultBeverages, FACTOR_MAX, FACTOR_MIN } from '@/domain/hydration';
import { useSettings } from '@/store/settings';
import { beverageIcons } from '@/ui/icons';
import { IconCircle } from '@/ui/SettingsRow';
import { Screen } from '@/ui/Screen';
import { Stepper, TextButton } from '@/ui/controls';

export default function BeveragesSettings() {
  const { colors, spacing, type } = useTheme();
  const { beverages, setBeverages } = useSettings();
  const set = (id: string, factor: number) => setBeverages(beverages.map((b) => (b.id === id ? { ...b, factor: clampFactor(factor) } : b)));

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('settings.beverages'), headerShown: true }} />
      <Text style={[type.body, { color: colors.textMuted }]}>{t('beveragesScreen.intro')}</Text>
      {beverages.map((b) => {
        const name = t(`beverages.${b.id}`);
        return (
          <Card key={b.id} style={{ gap: spacing.md }}>
            <View style={styles.head}>
              <IconCircle icon={beverageIcons[b.id]} />
              <View style={styles.flex}>
                <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{name}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>{t('beveragesScreen.example', { name, counted: Math.round(250 * b.factor) })}</Text>
              </View>
            </View>
            <Stepper
              value={Math.round(b.factor * 100)}
              min={FACTOR_MIN * 100}
              max={FACTOR_MAX * 100}
              step={5}
              label={name}
              format={(v) => `${v}%`}
              onChange={(v) => set(b.id, v / 100)}
              decreaseLabel={t('beveragesScreen.less', { name })}
              increaseLabel={t('beveragesScreen.more', { name })}
            />
          </Card>
        );
      })}
      <TextButton label={t('beveragesScreen.reset')} onPress={() => setBeverages(defaultBeverages)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
