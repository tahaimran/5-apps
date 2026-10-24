import { StyleSheet, View } from 'react-native';
import Flame from 'lucide-react-native/icons/flame';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from './AppText';

/** The flame and day count (plan §5). Hidden at zero: no pressure before the first day. */
export function StreakChip({ streak }: { streak: number }) {
  const { radius, spacing, mode } = useTheme();
  const x = extraColorsFor(mode);
  if (streak <= 0) return null;
  return (
    <View
      accessible
      accessibilityLabel={t('home.streakLabel', { count: streak })}
      style={[styles.chip, { gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: x.streakSoft }]}
    >
      <Flame size={18} color={x.streak} fill={x.streak} strokeWidth={2} />
      <AppText variant="body" style={styles.bold}>
        {String(streak)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', minHeight: 36, alignSelf: 'flex-start' },
  bold: { fontWeight: '800' },
});
