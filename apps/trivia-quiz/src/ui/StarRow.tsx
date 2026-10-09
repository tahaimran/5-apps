import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { extraColors } from '@/theme/tokens';

/** Up to three stars; empty stars are outlines and the spoken label says the number, so colour is never the only cue. */
export function StarRow({ stars, size = 24 }: { stars: number; size?: number }) {
  const { colors, mode } = useTheme();
  const gold = extraColors[mode].star;
  return (
    <View accessible accessibilityLabel={t('stars.label', { count: stars })} style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <MaterialCommunityIcons key={i} name={i <= stars ? 'star' : 'star-outline'} size={size} color={i <= stars ? gold : colors.textMuted} />
      ))}
    </View>
  );
}
