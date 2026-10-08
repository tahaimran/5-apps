import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Screen } from '@/ui/Screen';

export default function Settings() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('settings.title')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.archive')}
        onPress={() => router.push('/archive')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: touchTarget + 8,
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        <MaterialCommunityIcons name="archive-outline" size={24} color={colors.textMuted} />
        <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{t('settings.archive')}</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
      </Pressable>
      <Text style={[type.body, { color: colors.textMuted }]}>
        {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </Screen>
  );
}
