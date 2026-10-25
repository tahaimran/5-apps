import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Flame from 'lucide-react-native/icons/flame';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { IconComponent } from '@shared/ui';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { AppText } from './AppText';

/**
 * A small frosted pill on the sky: an icon (or a drawn star) and a value, like the coin counter of the
 * reference screens. It shows real progress only (a streak, stars collected), never a currency.
 */
export function HudChip({ icon: Icon, art, tint, value, label }: { icon?: IconComponent; art?: ReactNode; tint?: string; value: string; label: string }) {
  const { colors, radius, spacing, type, shadow, fonts } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.chip,
        { gap: spacing.xs + 2, minHeight: 44, paddingLeft: spacing.sm, paddingRight: spacing.md, borderRadius: radius.pill, backgroundColor: hc ? colors.background : app.frost },
        hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1),
      ]}
    >
      {art ?? (Icon ? <Icon size={22} color={tint ?? colors.primary} strokeWidth={2.4} /> : null)}
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '800', fontFamily: fonts.display }]}>{value}</AppText>
    </View>
  );
}

/** The flame and day count in the Home header (plan §5.1). Hidden at zero: no pressure before the first day. */
export function StreakChip({ streak }: { streak: number }) {
  const app = useAppColors();
  if (streak <= 0) return null;
  return <HudChip icon={Flame} tint={app.flame} value={String(streak)} label={t('home.streakLabel', { count: streak })} />;
}

const styles = StyleSheet.create({ chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' } });
