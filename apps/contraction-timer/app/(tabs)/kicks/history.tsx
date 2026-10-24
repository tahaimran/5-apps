import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Footprints from 'lucide-react-native/icons/footprints';
import Hourglass from 'lucide-react-native/icons/hourglass';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { Sparkline } from '@/components/Sparkline';
import { describeMinutes, isComplete, timeToTarget } from '@/domain/kicks';
import { useKicks } from '@/store/kicks';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { EmptyState } from '@/ui/EmptyState';
import { shortDate } from '@/ui/format';
import { StackHeader } from '@/ui/Screen';
import { IconCircle } from '@/ui/SettingsRow';

/** How many counts the sparkline draws. */
export const SPARK_COUNTS = 14;

/** Plan §5.3: the saved counts, newest first, with a line of how long each took to reach the target. */
export default function KickHistory() {
  const { colors, spacing, radius, type, shadow } = useTheme();
  useAdScreen('kickHistory');
  const history = useKicks((s) => s.history);
  const done = history.filter(isComplete).slice(0, SPARK_COUNTS).reverse();
  const minutes = done.map((s) => describeMinutes(timeToTarget(s) ?? 0));
  const target = done[done.length - 1]?.target;
  const spark =
    minutes.length === 0
      ? null
      : minutes.length === 1
        ? t('kicks.sparkOne', { first: minutes[0] })
        : t('kicks.sparkLabel', { n: minutes.length, first: minutes[0], last: minutes[minutes.length - 1] });
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <StackHeader title={t('kicks.historyTitle')} />
      <FlatList
        data={history}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: spacing.xl - 4, paddingTop: spacing.xs, gap: spacing.sm, flexGrow: 1 }}
        ListHeaderComponent={
          spark ? (
            <Card style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
              <View accessible accessibilityLabel={spark} style={{ gap: spacing.sm }}>
                <AppText style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{t('kicks.sparkTitle', { target: target ?? 10 })}</AppText>
                <Sparkline values={minutes} />
              </View>
            </Card>
          ) : null
        }
        ListEmptyComponent={<EmptyState icon={Footprints} text={t('kicks.historyEmpty')} />}
        renderItem={({ item }) => {
          const date = shortDate(item.startedAt);
          const complete = isComplete(item);
          const min = describeMinutes((complete ? timeToTarget(item) : (item.endedAt ?? item.startedAt) - item.startedAt) ?? 0);
          const text = complete ? t('kicks.row', { date, count: item.taps.length, min }) : t('kicks.rowShort', { date, count: item.taps.length, target: item.target, min });
          const label = complete ? t('kicks.rowLabel', { date, count: item.taps.length, min }) : t('kicks.rowShortLabel', { date, count: item.taps.length, target: item.target, min });
          return (
            <View accessible accessibilityLabel={label} style={[styles.row, { minHeight: 64, padding: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface }, shadow(1)]}>
              <IconCircle icon={complete ? CircleCheck : Hourglass} tint={complete ? colors.primary : colors.textMuted} bg={complete ? colors.primarySoft : colors.surfaceAlt} />
              <AppText style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '600' }]}>{text}</AppText>
            </View>
          );
        }}
      />
      <BannerSlot placement="history_banner" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
