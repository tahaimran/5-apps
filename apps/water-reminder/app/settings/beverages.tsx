import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { beverageIcons, clampFactor, defaultBeverages, FACTOR_MAX, FACTOR_MIN } from '@/domain/hydration';
import { useSettings } from '@/store/settings';
import { Screen } from '@/ui/Screen';
import { Stepper, TextButton } from '@/ui/controls';

export default function BeveragesSettings() {
  const { colors, spacing, radius, type } = useTheme();
  const { beverages, setBeverages } = useSettings();
  const set = (id: string, factor: number) => setBeverages(beverages.map((b) => (b.id === id ? { ...b, factor: clampFactor(factor) } : b)));

  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.beverages'), headerShown: true }} />
      <Text style={[type.body, { color: colors.textMuted }]}>{t('beveragesScreen.intro')}</Text>
      {beverages.map((b) => (
        <View key={b.id} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <MaterialCommunityIcons name={beverageIcons[b.id] as never} size={24} color={colors.primary} />
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t(`beverages.${b.id}`)}</Text>
          </View>
          <Stepper
            value={Math.round(b.factor * 100)}
            min={FACTOR_MIN * 100}
            max={FACTOR_MAX * 100}
            step={5}
            label={t(`beverages.${b.id}`)}
            format={(v) => `${v}%`}
            onChange={(v) => set(b.id, v / 100)}
            decreaseLabel={t('beveragesScreen.less', { name: t(`beverages.${b.id}`) })}
            increaseLabel={t('beveragesScreen.more', { name: t(`beverages.${b.id}`) })}
          />
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('beveragesScreen.example', { name: t(`beverages.${b.id}`), counted: Math.round(250 * b.factor) })}</Text>
        </View>
      ))}
      <TextButton label={t('beveragesScreen.reset')} onPress={() => setBeverages(defaultBeverages)} />
    </Screen>
  );
}
