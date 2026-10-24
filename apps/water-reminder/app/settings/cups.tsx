import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { defaultCups } from '@/domain/defaults';
import { useSettings } from '@/store/settings';
import { AmountStepper } from '@/ui/AmountStepper';
import { cupIcon } from '@/ui/icons';
import { IconCircle } from '@/ui/SettingsRow';
import { Screen } from '@/ui/Screen';
import { Chip, TextButton } from '@/ui/controls';

export default function CupsSettings() {
  const { colors, spacing, type } = useTheme();
  const { cups, prefs, goal, setCups, setPrefs } = useSettings();
  const unit = goal.unit;
  const resize = (id: string, ml: number) => setCups(cups.map((c) => (c.id === id ? { ...c, ml } : c)));

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('settings.cups'), headerShown: true }} />
      <Text style={[type.body, { color: colors.textMuted }]}>{t('cupsScreen.intro')}</Text>
      {cups.map((cup) => {
        const name = defaultCups.some((d) => d.label === cup.label) || cup.label === 'custom' ? t(`cups.${cup.label}`) : cup.label;
        const preferred = cup.id === prefs.preferredCupId;
        return (
          <Card key={cup.id} style={[{ gap: spacing.md }, preferred && { borderWidth: 2, borderColor: colors.primary }]}>
            <View style={styles.head}>
              <IconCircle icon={cupIcon(cup.icon)} />
              <Text style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '700' }]}>{name}</Text>
              <Chip label={preferred ? t('cupsScreen.preferred') : t('cupsScreen.makePreferred')} selected={preferred} onPress={() => setPrefs({ preferredCupId: cup.id })} />
            </View>
            <AmountStepper
              valueMl={cup.ml}
              onChange={(ml) => resize(cup.id, ml)}
              unit={unit}
              minMl={50}
              maxMl={1000}
              kind="drink"
              label={name}
              decreaseLabel={t('cupsScreen.smaller', { name })}
              increaseLabel={t('cupsScreen.bigger', { name })}
            />
          </Card>
        );
      })}
      <TextButton
        label={t('cupsScreen.reset')}
        onPress={() => {
          setCups(defaultCups);
          setPrefs({ preferredCupId: 'cup-250' });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
