import { StyleSheet, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { SECOND } from '@/domain/defaults';
import type { LastContraction } from '@/domain/stats';
import type { Intensity } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { ChipRow } from '@/ui/Choice';
import { compact, mmss, spoken } from '@/ui/format';

/** Plan F2: the strength chips stay for 8 seconds after a contraction stops. */
export const CHIP_WINDOW_MS = 8 * SECOND;
const LEVELS: Intensity[] = ['mild', 'moderate', 'strong'];

/**
 * The last contraction that counts: how long it lasted and how long after the one before it began.
 * For 8 seconds after it stopped, three chips tag it Mild, Moderate or Strong. The chips are optional and
 * never block the next Start (they are not modal and Start works while they are showing).
 */
export function LastContractionCard({ last, now, onTag }: { last: LastContraction | null; now: number; onTag: (id: string, intensity: Intensity | undefined) => void }) {
  const { colors, spacing, type, fonts } = useTheme();
  if (!last) {
    return (
      <Card>
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('last.none')}</AppText>
      </Card>
    );
  }
  const c = last.contraction;
  const showChips = c.endedAt !== null && now - c.endedAt >= 0 && now - c.endedAt < CHIP_WINDOW_MS;
  const label =
    last.intervalMs === null
      ? t('last.labelFirst', { length: spoken(last.durationMs) })
      : t('last.label', { length: spoken(last.durationMs), gap: spoken(last.intervalMs) });
  const big = [type.headline, { color: colors.text, fontFamily: fonts.display, fontWeight: '800' as const, fontVariant: ['tabular-nums' as const] }];
  return (
    <Card style={{ gap: spacing.md }}>
      <View accessible accessibilityLabel={label} style={{ gap: spacing.sm }}>
        <AppText style={[type.caption, { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }]}>{t('last.title')}</AppText>
        <View style={[styles.row, { gap: spacing.xl }]}>
          <View>
            <AppText style={[type.body, { color: colors.textMuted }]}>{t('last.length')}</AppText>
            <AppText style={big}>{mmss(last.durationMs)}</AppText>
          </View>
          {last.intervalMs !== null ? (
            <View style={styles.shrink}>
              <AppText style={[type.body, { color: colors.textMuted }]}>{`${t('last.gap')} (${t('last.gapNote')})`}</AppText>
              <AppText style={big}>{compact(last.intervalMs)}</AppText>
            </View>
          ) : null}
        </View>
      </View>
      {showChips ? (
        <View style={{ gap: spacing.sm }}>
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('last.strengthTitle')}</AppText>
          <ChipRow options={LEVELS.map((level) => ({ value: level, label: t(`intensity.${level}`) }))} value={c.intensity} onChange={(level) => onTag(c.id, level)} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  shrink: { flexShrink: 1 },
});
