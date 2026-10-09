import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { WindowStats } from '@/domain/stats';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { compact } from '@/ui/format';
import { Sheet } from '@/ui/Sheet';

type Kind = 'count' | 'length' | 'interval';

/**
 * Plan F4: the last hour in three tiles (how many, how long, how often). Each tile opens a short
 * explanation. The values change when a contraction stops or the window moves, not every second.
 */
export function StatsStrip({ stats }: { stats: WindowStats }) {
  const { colors, spacing, radius, type } = useTheme();
  const [open, setOpen] = useState<Kind | null>(null);
  const dash = t('stats.none');
  const tiles: { kind: Kind; title: string; value: string }[] = [
    { kind: 'count', title: t('stats.countTitle'), value: stats.count > 0 ? t('stats.countValue', { n: stats.count }) : dash },
    { kind: 'length', title: t('stats.lengthTitle'), value: stats.avgDurationMs === null ? dash : compact(stats.avgDurationMs) },
    { kind: 'interval', title: t('stats.intervalTitle'), value: stats.avgIntervalMs === null ? dash : t('stats.intervalValue', { time: compact(stats.avgIntervalMs) }) },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.kind}
          accessibilityRole="button"
          accessibilityLabel={t('stats.label', { title: tile.title, value: tile.value })}
          accessibilityHint={t('stats.tapHint')}
          onPress={() => setOpen(tile.kind)}
          style={{ flex: 1, minHeight: 80, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', gap: 2 }}
        >
          <AppText style={[type.caption, { color: colors.textMuted }]}>{tile.title}</AppText>
          <AppText adjustsFontSizeToFit numberOfLines={2} style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {tile.value}
          </AppText>
        </Pressable>
      ))}
      <Sheet visible={open !== null} onClose={() => setOpen(null)}>
        {open ? (
          <>
            <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>
              {tiles.find((x) => x.kind === open)!.title}
            </AppText>
            <AppText style={[type.bodyLarge, { color: colors.text }]}>{t(open === 'count' ? 'stats.explainCount' : open === 'length' ? 'stats.explainLength' : 'stats.explainInterval')}</AppText>
            <BigButton tall label={t('common.done')} onPress={() => setOpen(null)} />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
