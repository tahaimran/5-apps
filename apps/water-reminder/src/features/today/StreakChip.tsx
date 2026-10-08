import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { extraColorsFor } from '@/theme/tokens';

/** "🔥 6" in the header. Hidden while there is no streak. */
export function StreakChip({ streak }: { streak: number }) {
  const { colors, radius, type, mode } = useTheme();
  if (streak <= 0) return null;
  return (
    <View
      accessible
      accessibilityLabel={t('today.streak', { count: streak })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 12, minHeight: 36 }}
    >
      <MaterialCommunityIcons name="fire" size={20} color={extraColorsFor(mode).sun} />
      <Text style={[type.body, { color: colors.text, fontWeight: '800' }]}>{streak}</Text>
    </View>
  );
}
