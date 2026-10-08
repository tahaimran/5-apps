import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

/** One to three stars out of three; empty stars are outlines, and the label says the number. */
export function StarRow({ stars, size = 24 }: { stars: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={t('stars.label', { count: stars })} style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <MaterialCommunityIcons key={i} name={i <= stars ? 'star' : 'star-outline'} size={size} color={i <= stars ? colors.accent : colors.textMuted} />
      ))}
    </View>
  );
}
