import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Hash from 'lucide-react-native/icons/hash';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Repeat from 'lucide-react-native/icons/repeat';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, type IconComponent } from '@shared/ui';
import type { WindowStats } from '@/domain/stats';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { compact } from '@/ui/format';
import { StatTile } from '@/ui/SettingsRow';
import { Sheet } from '@/ui/Sheet';

type Kind = 'count' | 'length' | 'interval';

/**
 * Plan F4: the last hour in three tiles (how many, how long, how often). Each tile opens a short
 * explanation. The values change when a contraction stops or the window moves, not every second.
 */
export function StatsStrip({ stats }: { stats: WindowStats }) {
  const { colors, spacing, type } = useTheme();
  const app = useAppColors();
  const [open, setOpen] = useState<Kind | null>(null);
  const dash = t('stats.none');
  const tiles: { kind: Kind; icon: IconComponent; title: string; value: string; tint: string; bg: string }[] = [
    { kind: 'count', icon: Hash, title: t('stats.countTitle'), value: stats.count > 0 ? t('stats.countValue', { n: stats.count }) : dash, tint: colors.primary, bg: colors.primarySoft },
    { kind: 'length', icon: Hourglass, title: t('stats.lengthTitle'), value: stats.avgDurationMs === null ? dash : compact(stats.avgDurationMs), tint: app.activeText, bg: app.activeSoft },
    { kind: 'interval', icon: Repeat, title: t('stats.intervalTitle'), value: stats.avgIntervalMs === null ? dash : t('stats.intervalValue', { time: compact(stats.avgIntervalMs) }), tint: colors.accent, bg: colors.surfaceAlt },
  ];
  const shown = tiles.find((x) => x.kind === open);
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      {tiles.map((tile) => (
        <StatTile key={tile.kind} icon={tile.icon} label={tile.title} value={tile.value} tint={tile.tint} bg={tile.bg} accessibilityHint={t('stats.tapHint')} onPress={() => setOpen(tile.kind)} />
      ))}
      <Sheet visible={open !== null} onClose={() => setOpen(null)} title={shown?.title}>
        {open ? (
          <>
            <AppText style={[type.bodyLarge, { color: colors.text }]}>{t(open === 'count' ? 'stats.explainCount' : open === 'length' ? 'stats.explainLength' : 'stats.explainInterval')}</AppText>
            <Button label={t('common.done')} onPress={() => setOpen(null)} />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap' } });
