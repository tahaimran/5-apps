import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Hourglass from 'lucide-react-native/icons/hourglass';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useTimeFormat } from '@shared/time';
import { PressableScale } from '@shared/ui';
import type { LogEntry, Unit } from '@/domain/types';
import { spokenVolume, volume } from '@/ui/format';
import { beverageIcons } from '@/ui/icons';
import { IconCircle } from '@/ui/SettingsRow';

/**
 * Today's drinks as a card of rows, newest first, with the next reminder pinned on top (the
 * "records" list from the design references). Tapping a drink opens it for editing.
 */
export function DrinkList({
  entries,
  unit,
  next,
  onEdit,
}: {
  entries: LogEntry[];
  unit: Unit;
  /** The coming reminder and the cup it will offer. */
  next: { time: string; ml: number } | null;
  onEdit: (id: string) => void;
}) {
  const { colors, radius, spacing, type, shadow, fonts, touchTarget } = useTheme();
  const clock = useTimeFormat();
  const row = { minHeight: touchTarget + 16, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md };
  const divider = <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: spacing.lg + 36 + spacing.md }]} />;
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }, shadow(1)]}>
      {next && (
        <View accessible accessibilityLabel={t('today.nextRowLabel', { time: next.time, amount: spokenVolume(next.ml, unit) })} style={[styles.row, row]}>
          <IconCircle icon={Hourglass} tint={colors.textMuted} bg={colors.surfaceAlt} />
          <View style={styles.flex}>
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700', fontFamily: fonts.display }]}>{next.time}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('today.nextRow')}</Text>
          </View>
          <Text style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{volume(next.ml, unit)}</Text>
        </View>
      )}
      {entries.map((l, i) => {
        const time = clock.at(new Date(l.ts));
        const Icon = beverageIcons[l.beverage];
        return (
          <Fragment key={l.id}>
            {(i > 0 || next) && divider}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t('today.entry', { time, beverage: t(`beverages.${l.beverage}`), amount: spokenVolume(l.volumeMl, unit) })}
              accessibilityHint={t('today.editHint')}
              onPress={() => onEdit(l.id)}
              scaleTo={0.98}
              style={[styles.row, row]}
            >
              <IconCircle icon={Icon} />
              <View style={styles.flex}>
                <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700', fontFamily: fonts.display }]}>{time}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  {t(`beverages.${l.beverage}`)}
                  {l.effectiveMl !== l.volumeMl ? ` · ${t('today.countsAs', { amount: volume(l.effectiveMl, unit) })}` : ''}
                </Text>
              </View>
              <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{volume(l.volumeMl, unit)}</Text>
              <ChevronRight size={18} color={colors.textMuted} strokeWidth={2.25} />
            </PressableScale>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
});
