import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { sessionEnd, sessionStart } from '@/domain/session';
import { sessionStats } from '@/domain/stats';
import type { ContractionSession } from '@/domain/types';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { clockTime, compact, shortDate, spoken } from '@/ui/format';

/** One row of the history list (plan §5.2): date, start–end, count, average length and gap, a mark if the rule matched. */
export function SessionCard({ session, active, onPress }: { session: ContractionSession; active: boolean; onPress: () => void }) {
  const { colors, spacing, radius, type } = useTheme();
  const clock24h = useSettings((s) => s.settings.clock24h);
  const stats = sessionStats(session.contractions);
  const start = sessionStart(session);
  const end = sessionEnd(session);
  const date = shortDate(start);
  const range = t('history.range', { start: clockTime(start, clock24h), end: active ? t('history.inProgress') : clockTime(end, clock24h) });
  const length = stats.avgDurationMs === null ? t('stats.none') : compact(stats.avgDurationMs);
  const gap = stats.avgIntervalMs === null ? t('stats.none') : compact(stats.avgIntervalMs);
  const label = active
    ? t('history.rowOpen', { date, start: clockTime(start, clock24h), count: stats.count })
    : t('history.row', { date, start: clockTime(start, clock24h), end: clockTime(end, clock24h), count: stats.count, length: stats.avgDurationMs === null ? length : spoken(stats.avgDurationMs), gap: stats.avgIntervalMs === null ? gap : spoken(stats.avgIntervalMs) });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 88,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: active ? 3 : 1,
        borderColor: active ? colors.text : colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        gap: spacing.xs,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{`${date} · ${range}`}</AppText>
        {session.patternMatchedAt !== undefined ? <MaterialCommunityIcons accessible={false} name="bell-ring-outline" size={24} color={colors.text} /> : null}
      </View>
      <AppText style={[type.body, { color: colors.textMuted }]}>
        {`${t('history.count', { n: stats.count })} · ${t('history.avgLength', { time: length })} · ${t('history.avgGap', { time: gap })}`}
      </AppText>
    </Pressable>
  );
}
