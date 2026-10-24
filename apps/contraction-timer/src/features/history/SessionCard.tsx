import { StyleSheet, View } from 'react-native';
import BellRing from 'lucide-react-native/icons/bell-ring';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import Timer from 'lucide-react-native/icons/timer';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import { sessionEnd, sessionStart } from '@/domain/session';
import { sessionStats } from '@/domain/stats';
import type { ContractionSession } from '@/domain/types';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { clockTime, compact, shortDate, spoken, useClock24h } from '@/ui/format';
import { IconCircle } from '@/ui/SettingsRow';

/** One row of the history list (plan §5.2): date, start–end, count, average length and gap, a mark if the rule matched. */
export function SessionCard({ session, active, onPress }: { session: ContractionSession; active: boolean; onPress: () => void }) {
  const { colors, spacing, radius, type, shadow } = useTheme();
  const app = useAppColors();
  const clock24h = useClock24h();
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
  const matched = session.patternMatchedAt !== undefined;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={matched ? `${label}. ${t('history.matched')}` : label}
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.card, { minHeight: 88, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderColor: active ? app.active : colors.surface }, shadow(1)]}
    >
      <IconCircle icon={active ? Timer : CalendarClock} tint={active ? app.activeText : colors.primary} bg={active ? app.activeSoft : colors.primarySoft} />
      <View style={[styles.flex, { gap: 2 }]}>
        <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{date}</AppText>
        <AppText style={[type.body, { color: active ? app.activeText : colors.text, fontWeight: '600' }]}>{range}</AppText>
        <AppText style={[type.body, { color: colors.textMuted }]}>{`${t('history.count', { n: stats.count })} · ${t('history.avgLength', { time: length })} · ${t('history.avgGap', { time: gap })}`}</AppText>
      </View>
      {matched ? <IconCircle icon={BellRing} tint={app.alertIcon} bg={app.alertBg} size={34} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 2 },
});
