import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarHeart from 'lucide-react-native/icons/calendar-heart';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ClipboardList from 'lucide-react-native/icons/clipboard-list';
import Luggage from 'lucide-react-native/icons/luggage';
import { NativeAdCard } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card, PressableScale, ProgressRing } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { withAdSlots, type ListItem } from '@/domain/adSlots';
import { progressOf } from '@/domain/checklists';
import { currentCardWeek, orderedCards, weekCard, type WeekCard } from '@/domain/weeks';
import { useChecklist } from '@/hooks/useChecklist';
import { usePregnancy } from '@/hooks/usePregnancy';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { TabTitle } from '@/ui/Screen';
import { WeekBadge } from '@/ui/WeekBadge';
import { IconCircle, NavRow, SettingsGroup } from '@/ui/SettingsRow';

/** A full term in days (40 weeks), for the ring around the week. */
const TERM_DAYS = 280;
const RING = 104;

/** Plan §5.4: where you are, the tools, and the week-by-week cards with the current week pinned first. */
export default function Pregnancy() {
  const { colors, spacing, radius, type, shadow, fonts } = useTheme();
  const app = useAppColors();
  const adsReady = useAdScreen('weeks');
  const { gestation, shown } = usePregnancy();
  const bag = progressOf(useChecklist('hospitalBag'));
  const plan = progressOf(useChecklist('birthPlan'));
  const currentWeek = shown ? currentCardWeek(shown.weeks) : null;
  const cards = withAdSlots(orderedCards(shown?.weeks ?? null));

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
      <TabTitle title={t('pregnancy.title')} />
      {gestation && shown ? (
        <View style={[{ borderRadius: radius.xl }, shadow(2)]}>
          <View
            accessible
            accessibilityLabel={t('pregnancy.headerLabel', { weeks: shown.weeks, days: shown.day, toGo, size: current ? t('pregnancy.sizeLine', { size: current.size }) : '' })}
            style={[styles.hero, { borderRadius: radius.xl, padding: spacing.xl - 4, gap: spacing.lg }]}
          >
            <LinearGradient colors={app.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <ProgressRing size={RING} strokeWidth={9} progress={gestation.days / TERM_DAYS} color={app.heroRing} trackColor={app.heroTrack}>
              <AppText style={{ fontSize: 34, lineHeight: 38, color: app.onHero, fontFamily: fonts.display, fontWeight: '800' }}>{shown.weeks}</AppText>
              <AppText style={[type.caption, { color: app.heroMuted, fontWeight: '700' }]}>{t('pregnancy.weeksShort')}</AppText>
            </ProgressRing>
            <View style={[styles.flex, { gap: spacing.xs }]}>
              <AppText style={[type.title, { color: app.onHero, fontWeight: '800' }]}>{t('pregnancy.header', { weeks: shown.weeks, days: shown.day })}</AppText>
              <AppText style={[type.bodyLarge, { color: app.onHero, fontWeight: '700' }]}>{toGo}</AppText>
              {gestation.pastDue ? (
                <AppText style={[type.body, { color: app.heroMuted }]}>{t('pregnancy.pastDue')}</AppText>
              ) : current ? (
                <AppText style={[type.body, { color: app.heroMuted }]}>{t('pregnancy.sizeLine', { size: current.size })}</AppText>
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <Card style={{ gap: spacing.md }}>
          <IconCircle icon={CalendarHeart} size={48} />
          <AppText style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t('pregnancy.noDue')}</AppText>
          <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('pregnancy.noDueBody')}</AppText>
          <Button icon={CalendarHeart} label={t('pregnancy.addDue')} onPress={() => router.push('/pregnancy/due-date')} />
        </Card>
      )}
      {shown && [34, 36, 37].includes(shown.weeks) && bag.percent < 100 ? (
        <SettingsGroup>
          <NavRow icon={Luggage} label={t('pregnancy.bagNudge', { percent: bag.percent })} detail={t('pregnancy.bagNudgeBody')} tint={app.alertIcon} bg={app.alertBg} onPress={() => router.push('/pregnancy/hospital-bag')} />
        </SettingsGroup>
      ) : null}
      <SettingsGroup>
        <NavRow icon={CalendarHeart} label={t(gestation ? 'pregnancy.dueRowEdit' : 'pregnancy.dueRow')} onPress={() => router.push('/pregnancy/due-date')} />
        <NavRow icon={Luggage} label={t('pregnancy.bagRow')} detail={t('pregnancy.bagProgress', { percent: bag.percent })} onPress={() => router.push('/pregnancy/hospital-bag')} />
        <NavRow
          icon={ClipboardList}
          label={t('pregnancy.planRow')}
          detail={t('pregnancy.planProgress', { checked: plan.checked, total: plan.total })}
          tint={colors.accent}
          bg={colors.surfaceAlt}
          onPress={() => router.push('/pregnancy/birth-plan')}
        />
      </SettingsGroup>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', marginTop: spacing.sm }]}>{t('pregnancy.weeksTitle')}</AppText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList<ListItem<WeekCard>>
        style={styles.clip}
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
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t(isCurrent ? 'pregnancy.weekRowCurrentLabel' : 'pregnancy.weekRowLabel', { n: item.week, size: item.size })}
              onPress={() => router.push({ pathname: '/pregnancy/week/[n]', params: { n: String(item.week) } })}
              scaleTo={0.98}
              style={[
                styles.row,
                { minHeight: 64, gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: isCurrent ? colors.primary : colors.surface, backgroundColor: colors.surface },
                shadow(1),
              ]}
            >
              <WeekBadge week={item.week} current={isCurrent} />
              <View style={styles.flex}>
                <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t(isCurrent ? 'pregnancy.weekRowCurrent' : 'pregnancy.weekRow', { n: item.week })}</AppText>
                <AppText style={[type.body, { color: colors.textMuted }]}>{item.size}</AppText>
              </View>
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={2.25} />
            </PressableScale>
          );
        }}
      />
      <BannerSlot placement="week_banner" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  hero: { overflow: 'hidden', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
