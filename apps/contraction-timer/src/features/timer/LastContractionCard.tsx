import { Pressable, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { SECOND } from '@/domain/defaults';
import type { LastContraction } from '@/domain/stats';
import type { Intensity } from '@/domain/types';
import { AppText } from '@/ui/AppText';
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
  const { colors, spacing, radius, type } = useTheme();
  if (!last) {
    return (
      <View style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('last.none')}</AppText>
      </View>
    );
  }
  const c = last.contraction;
  const showChips = c.endedAt !== null && now - c.endedAt >= 0 && now - c.endedAt < CHIP_WINDOW_MS;
  const label =
    last.intervalMs === null
      ? t('last.labelFirst', { length: spoken(last.durationMs) })
      : t('last.label', { length: spoken(last.durationMs), gap: spoken(last.intervalMs) });
  return (
    <View style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.md }}>
      <View accessible accessibilityLabel={label} style={{ gap: spacing.xs }}>
        <AppText style={[type.body, { color: colors.textMuted }]}>{t('last.title')}</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.xl }}>
          <View>
            <AppText style={[type.caption, { color: colors.textMuted }]}>{t('last.length')}</AppText>
            <AppText style={[type.headline, { color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{mmss(last.durationMs)}</AppText>
          </View>
          {last.intervalMs !== null ? (
            <View style={{ flexShrink: 1 }}>
              <AppText style={[type.caption, { color: colors.textMuted }]}>{`${t('last.gap')} (${t('last.gapNote')})`}</AppText>
              <AppText style={[type.headline, { color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{compact(last.intervalMs)}</AppText>
            </View>
          ) : null}
        </View>
      </View>
      {showChips ? (
        <View style={{ gap: spacing.sm }}>
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('last.strengthTitle')}</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {LEVELS.map((level) => {
              const selected = c.intensity === level;
              return (
                <Pressable
                  key={level}
                  accessibilityRole="button"
                  accessibilityLabel={t(`intensity.${level}`)}
                  accessibilityState={{ selected }}
                  onPress={() => onTag(c.id, selected ? undefined : level)}
                  style={{
                    flex: 1,
                    minWidth: 96,
                    minHeight: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.pill,
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? colors.text : colors.border,
                    backgroundColor: selected ? colors.surfaceAlt : colors.background,
                  }}
                >
                  <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: selected ? '700' : '500' }]}>{t(`intensity.${level}`)}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
