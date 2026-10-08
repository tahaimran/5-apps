import { Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { Cup, Unit } from '@/domain/types';
import { cupThemeById } from '@/data/shop';
import { spokenVolume, volume } from '@/ui/format';

export const CHIP_HEIGHT = 56;

/** One quick-add chip: 56 dp tall, one tap logs the cup (plan §5.1, F2). */
export function CupChip({ cup, unit, theme, onPress }: { cup: Cup; unit: Unit; theme: string; onPress: () => void }) {
  const { colors, radius, type } = useTheme();
  const tint = cupThemeById(theme).pot;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('today.addCup', { amount: spokenVolume(cup.ml, unit) })}
      onPress={onPress}
      style={{
        minHeight: CHIP_HEIGHT,
        minWidth: 76,
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 12,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: tint,
      }}
    >
      <MaterialCommunityIcons name={cup.icon as never} size={22} color={tint} />
      <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{volume(cup.ml, unit)}</Text>
    </Pressable>
  );
}
