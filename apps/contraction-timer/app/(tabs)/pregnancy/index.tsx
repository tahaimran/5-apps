import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeAdCard } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { withAdSlots, type ListItem } from '@/domain/adSlots';
import { progressOf } from '@/domain/checklists';
import { currentCardWeek, orderedCards, weekCard, type WeekCard } from '@/domain/weeks';
import { useChecklist } from '@/hooks/useChecklist';
import { usePregnancy } from '@/hooks/usePregnancy';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { BigButton } from '@/ui/BigButton';

/** Plan §5.4: where you are, the tools, and the week-by-week cards with the current week pinned first. */
export default function Pregnancy() {
  const { colors, spacing, radius, type } = useTheme();
  const adsReady = useAdScreen('weeks');
  const { gestation, shown } = usePregnancy();
  const bag = progressOf(useChecklist('hospitalBag'));
  const plan = progressOf(useChecklist('birthPlan'));
  const currentWeek = shown ? currentCardWeek(shown.weeks) : null;
  const cards = withAdSlots(orderedCards(shown?.weeks ?? null));

  const row = (icon: 'calendar-heart' | 'bag-suitcase-outline' | 'clipboard-list-outline', label: string, detail: string | null, path: string) => (
    <Pressable
      key={path}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      onPress={() => router.push(path as never)}
      style={({ pressed }) => ({ minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}
    >
      <MaterialCommunityIcons accessible={false} name={icon} size={30} color={colors.text} />
      <View style={{ flex: 1 }}>
        <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{label}</AppText>
        {detail ? <AppText style={[type.body, { color: colors.textMuted }]}>{detail}</AppText> : null}
      </View>
      <MaterialCommunityIcons accessible={false} name="chevron-right" size={28} color={colors.textMuted} />
    </Pressable>
  );

  const toGo = !gestation
    ? ''
    : gestation.daysToGo > 1
      ? t('pregnancy.toGo', { n: gestation.daysToGo })
      : gestation.daysToGo === 1
        ? t('pregnancy.toGoOne')
        : gestation.daysToGo === 0
          ? t('pregnancy.dueToday')
          : gestation.daysToGo === -1
            ? t('pregnancy.pastDaysOne')
            : t('pregnancy.pastDays', { n: -gestation.daysToGo });
  const current = shown ? weekCard(currentCardWeek(shown.weeks)) : null;

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>{t('pregnancy.title')}</AppText>
      {gestation && shown ? (
        <View
          accessible
          accessibilityLabel={t('pregnancy.headerLabel', { weeks: shown.weeks, days: shown.day, toGo, size: current ? t('pregnancy.sizeLine', { size: current.size }) : '' })}
          style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface, gap: spacing.xs }}
        >
          <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{`${t('pregnancy.header', { weeks: shown.weeks, days: shown.day })} · ${toGo}`}</AppText>
          {gestation.pastDue ? <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('pregnancy.pastDue')}</AppText> : current ? <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('pregnancy.sizeLine', { size: current.size })}</AppText> : null}
        </View>
      ) : (
        <View style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.md }}>
          <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('pregnancy.noDue')}</AppText>
          <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('pregnancy.noDueBody')}</AppText>
          <BigButton tall label={t('pregnancy.addDue')} onPress={() => router.push('/pregnancy/due-date')} />
        </View>
      )}
      {shown && [34, 36, 37].includes(shown.weeks) && bag.percent < 100 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${t('pregnancy.bagNudge', { percent: bag.percent })}. ${t('pregnancy.bagNudgeBody')}`} onPress={() => router.push('/pregnancy/hospital-bag')} style={{ minHeight: 64, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, justifyContent: 'center' }}>
          <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('pregnancy.bagNudge', { percent: bag.percent })}</AppText>
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('pregnancy.bagNudgeBody')}</AppText>
        </Pressable>
      ) : null}
      {row('calendar-heart', t(gestation ? 'pregnancy.dueRowEdit' : 'pregnancy.dueRow'), null, '/pregnancy/due-date')}
      {row('bag-suitcase-outline', t('pregnancy.bagRow'), t('pregnancy.bagProgress', { percent: bag.percent }), '/pregnancy/hospital-bag')}
      {row('clipboard-list-outline', t('pregnancy.planRow'), t('pregnancy.planProgress', { checked: plan.checked, total: plan.total }), '/pregnancy/birth-plan')}
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>{t('pregnancy.weeksTitle')}</AppText>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FlatList<ListItem<WeekCard>>
        data={cards}
        extraData={adsReady}
        keyExtractor={(c) => (c.kind === 'ad' ? c.key : String(c.card.week))}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: spacing.xl - 4, gap: spacing.sm }}
        renderItem={({ item: entry }) => {
          // The native card is labelled "Ad" by the shared layer, and falls back to nothing (or a house card) when there is no fill.
          if (entry.kind === 'ad') return adsReady ? <NativeAdCard placement="week_native" /> : null;
          const item = entry.card;
          const isCurrent = item.week === currentWeek;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(isCurrent ? 'pregnancy.weekRowCurrentLabel' : 'pregnancy.weekRowLabel', { n: item.week, size: item.size })}
              onPress={() => router.push({ pathname: '/pregnancy/week/[n]', params: { n: String(item.week) } })}
              style={({ pressed }) => ({ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: isCurrent ? 3 : 1, borderColor: isCurrent ? colors.text : colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}
            >
              <AppText accessible={false} style={{ fontSize: 28, width: 40, textAlign: 'center', color: colors.text }}>{item.emoji ?? '•'}</AppText>
              <View style={{ flex: 1 }}>
                <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t(isCurrent ? 'pregnancy.weekRowCurrent' : 'pregnancy.weekRow', { n: item.week })}</AppText>
                <AppText style={[type.body, { color: colors.textMuted }]}>{item.size}</AppText>
              </View>
            </Pressable>
          );
        }}
      />
      <BannerSlot placement="week_banner" />
    </SafeAreaView>
  );
}
