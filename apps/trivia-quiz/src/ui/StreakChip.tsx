import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { extraColors } from '@/theme/tokens';
import { AppText } from './AppText';

/** The flame and day count (plan §5). Hidden at zero: no pressure before the first day. */
export function StreakChip({ streak }: { streak: number }) {
  const { colors, radius, spacing, mode } = useTheme();
  if (streak <= 0) return null;
  return (
    <View
      accessible
      accessibilityLabel={t('home.streakLabel', { count: streak })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }}
    >
      <MaterialCommunityIcons name="fire" size={22} color={extraColors[mode].streak} />
      <AppText variant="body" style={{ fontWeight: '700' }}>{t('home.streak', { count: streak })}</AppText>
    </View>
  );
}
