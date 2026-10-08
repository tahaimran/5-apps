import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { WordPack } from '@/domain/packs';
import { AppText } from './AppText';

/** A pack on Home: icon, name and the level the player is on. 120dp tall at least (plan §5.1). */
export function PackCard({ pack, level, onPress }: { pack: WordPack; level: number; onPress: () => void }) {
  const { colors, radius, spacing, type } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.packLabel', { name: pack.name, level })}
      onPress={onPress}
      style={{ flexBasis: '48%', flexGrow: 1, minHeight: 120, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', gap: spacing.xs }}
    >
      <MaterialCommunityIcons name={pack.icon as never} size={36} color={colors.primary} />
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{pack.name}</AppText>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('packs.level', { level })}</AppText>
    </Pressable>
  );
}
