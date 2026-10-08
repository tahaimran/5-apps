import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { defaultCups } from '@/domain/defaults';
import { useSettings } from '@/store/settings';
import { volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { Chip, Stepper, TextButton } from '@/ui/controls';

export default function CupsSettings() {
  const { colors, spacing, radius, type } = useTheme();
  const { cups, prefs, goal, setCups, setPrefs } = useSettings();
  const unit = goal.unit;
  const resize = (id: string, ml: number) => setCups(cups.map((c) => (c.id === id ? { ...c, ml } : c)));

  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.cups'), headerShown: true }} />
      <Text style={[type.body, { color: colors.textMuted }]}>{t('cupsScreen.intro')}</Text>
      {cups.map((cup) => {
        const name = defaultCups.some((d) => d.label === cup.label) || cup.label === 'custom' ? t(`cups.${cup.label}`) : cup.label;
        const preferred = cup.id === prefs.preferredCupId;
        return (
          <View key={cup.id} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }}>
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{name}</Text>
            <Stepper
              value={cup.ml}
              min={50}
              max={1000}
              step={50}
              label={name}
              format={(v) => volume(v, unit)}
              onChange={(ml) => resize(cup.id, ml)}
              decreaseLabel={t('onboarding.cupLess')}
              increaseLabel={t('onboarding.cupMore')}
            />
            <Chip label={preferred ? t('cupsScreen.preferred') : t('cupsScreen.makePreferred')} selected={preferred} onPress={() => setPrefs({ preferredCupId: cup.id })} />
          </View>
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
