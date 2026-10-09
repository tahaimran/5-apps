import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Sparkline } from '@/components/Sparkline';
import { describeMinutes, isComplete, timeToTarget } from '@/domain/kicks';
import { useKicks } from '@/store/kicks';
import { AppText } from '@/ui/AppText';
import { shortDate } from '@/ui/format';
import { ScreenHeader } from '@/ui/ScreenHeader';

/** How many counts the sparkline draws. */
export const SPARK_COUNTS = 14;

/** Plan §5.3: the saved counts, newest first, with a line of how long each took to reach the target. */
export default function KickHistory() {
  const { colors, spacing, radius, type } = useTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FlatList
        data={history}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: spacing.xl - 4, gap: spacing.md, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <ScreenHeader title={t('kicks.historyTitle')} />
            {spark ? (
              <View accessible accessibilityLabel={spark} style={{ padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.xs }}>
                <AppText style={[type.body, { color: colors.textMuted }]}>{t('kicks.sparkTitle', { target: target ?? 10 })}</AppText>
                <Sparkline values={minutes} />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('kicks.historyEmpty')}</AppText>
          </View>
        }
        renderItem={({ item }) => {
          const date = shortDate(item.startedAt);
          const complete = isComplete(item);
          const min = describeMinutes(((complete ? timeToTarget(item) : (item.endedAt ?? item.startedAt) - item.startedAt) ?? 0));
          const text = complete ? t('kicks.row', { date, count: item.taps.length, min }) : t('kicks.rowShort', { date, count: item.taps.length, target: item.target, min });
          const label = complete ? t('kicks.rowLabel', { date, count: item.taps.length, min }) : t('kicks.rowShortLabel', { date, count: item.taps.length, target: item.target, min });
          return (
            <View accessible accessibilityLabel={label} style={{ minHeight: 64, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' }}>
              <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{text}</AppText>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
