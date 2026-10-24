import { StyleSheet, Text, View } from 'react-native';
import Plus from 'lucide-react-native/icons/plus';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { cupThemeById } from '@/data/shop';
import type { Cup, Unit } from '@/domain/types';
import { spokenVolume, volume } from '@/ui/format';
import { cupIcon } from '@/ui/icons';

/** Quick-add tiles are 56dp+ tall per plan §7.5 (chips 56 dp). */
export const TILE_HEIGHT = 84;

function Tile({ icon: Icon, tint, label, a11y, onPress }: { icon: IconComponent; tint: string; label: string; a11y: string; onPress: () => void }) {
  const { colors, radius, type, shadow } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.tile, { minHeight: TILE_HEIGHT, borderRadius: radius.lg, backgroundColor: colors.surface }, shadow(1)]}
    >
      <View style={[styles.circle, { backgroundColor: tint + '22' }]}>
        <Icon size={20} color={tint} strokeWidth={2.25} />
      </View>
      <Text style={[type.caption, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** Four cup tiles and "Other": one tap logs a cup (plan §5.1, F2). The cup theme tints the icons. */
export function QuickAdd({ cups, unit, theme, onAdd, onOther }: { cups: Cup[]; unit: Unit; theme: string; onAdd: (cup: Cup) => void; onOther: () => void }) {
  const { colors } = useTheme();
  // Decorative: the amount label carries the meaning, so a pale theme color is fine here.
  const tint = cupThemeById(theme).pot;
  return (
    <View style={styles.row}>
      {cups.slice(0, 4).map((cup) => (
        <Tile
          key={cup.id}
          icon={cupIcon(cup.icon)}
          tint={tint}
          label={volume(cup.ml, unit)}
          a11y={t('today.addCup', { amount: spokenVolume(cup.ml, unit) })}
          onPress={() => onAdd(cup)}
        />
      ))}
      <Tile icon={Plus} tint={colors.textMuted} label={t('today.other')} a11y={t('today.otherLabel')} onPress={onOther} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { flexGrow: 1, flexBasis: 56, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4, paddingVertical: 10 },
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
