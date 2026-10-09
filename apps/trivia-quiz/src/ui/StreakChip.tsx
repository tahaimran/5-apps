import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

/** The flame and day count in the Home header. Hidden at zero: no pressure before the first day. */
export function StreakChip({ streak }: { streak: number }) {
  const { colors, radius, spacing, type } = useTheme();
  if (streak <= 0) return null;
  return (
    <View
      accessible
      accessibilityLabel={t('home.streakLabel', { count: streak })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }}
    >
      <MaterialCommunityIcons name="fire" size={22} color={colors.accent} />
      <AppText style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t('home.streak', { count: streak })}</AppText>
    </View>
  );
}
